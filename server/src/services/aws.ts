import { S3Client } from "@aws-sdk/client-s3";
import { SendMessageBatchCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import AWS, { AWSError, CognitoIdentityServiceProvider } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { createHash } from "crypto";
import { inject, injectable, interfaces } from "inversify";
import { Knex } from "knex";
import { chunk, isDefined } from "remeda";
import { Memoize } from "typescript-memoize";
import { Config, CONFIG } from "../config";
import { PetitionEvent, SystemEvent } from "../db/events";
import { unMaybeArray } from "../util/arrays";
import { awsLogger } from "../util/awsLogger";
import { MaybeArray } from "../util/types";
import { ILogger, LOGGER } from "./logger";
import { IStorage, Storage, STORAGE_FACTORY } from "./storage";

export interface IAws {
  publicFiles: IStorage;
  fileUploads: IStorage;
  temporaryFiles: IStorage;
  enqueueMessages(
    queue: keyof Config["queueWorkers"],
    messages: { id: string; body: any; groupId: string }[] | { body: any; groupId: string },
    t?: Knex.Transaction
  ): void;
  enqueueEvents(events: MaybeArray<PetitionEvent | SystemEvent>, t?: Knex.Transaction): void;
  getOrCreateCognitoUser(
    email: string,
    password: string | null,
    firstName: string,
    lastName: string,
    clientMetadata: {
      organizationName: string;
      organizationUser: string;
      locale: string;
    },
    sendEmail?: boolean
  ): Promise<string>;
  resetUserPassword(
    email: string,
    clientMetadata: {
      organizationName: string;
      organizationUser: string;
      locale: string;
    }
  ): Promise<void>;
  signUpUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clientMetadata: { locale: string }
  ): Promise<string>;
  deleteUser(email: string): Promise<void>;
  getUser(
    email: string
  ): Promise<PromiseResult<CognitoIdentityServiceProvider.AdminGetUserResponse, AWSError>>;
  forgotPassword(email: string, clientMetadata: { locale: string }): Promise<void>;
  resendVerificationCode(email: string, clientMetadata: { locale: string }): Promise<void>;
}

export const AWS_SERVICE = Symbol.for("AWS_SERVICE");

@injectable()
export class Aws implements IAws {
  @Memoize() private get s3() {
    return new S3Client({
      ...this.config.aws,
      useAccelerateEndpoint: true,
      logger: awsLogger(this.logger),
    });
  }

  @Memoize() private get sqs() {
    return new SQSClient({
      ...this.config.aws,
      endpoint: process.env.NODE_ENV === "development" ? "http://localhost:9324" : undefined,
      logger: awsLogger(this.logger),
    });
  }

  @Memoize() private get cognitoIdP() {
    return new AWS.CognitoIdentityServiceProvider();
  }

  @Memoize() public get fileUploads() {
    return this.storageFactory(this.s3, this.config.s3.fileUploadsBucketName) as Storage;
  }

  @Memoize() public get temporaryFiles() {
    return this.storageFactory(this.s3, this.config.s3.temporaryFilesBucketName) as Storage;
  }

  @Memoize() public get publicFiles() {
    return this.storageFactory(this.s3, this.config.s3.publicFilesBucketName) as Storage;
  }

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: ILogger,
    @inject(STORAGE_FACTORY)
    private storageFactory: interfaces.Factory<IStorage>
  ) {
    AWS.config.update({
      ...config.aws,
      signatureVersion: "v4",
      logger: { log: logger.debug.bind(logger) },
    });
  }

  private hash(value: string) {
    return createHash("md5").update(value).digest("hex");
  }

  async enqueueMessages(
    queue: keyof Config["queueWorkers"],
    messages: { id: string; body: any; groupId: string }[] | { body: any; groupId: string },
    t?: Knex.Transaction
  ) {
    if (isDefined(t)) {
      if (!t.isCompleted()) {
        t.executionPromise
          .then(() => this.sendSQSMessage(queue, messages))
          .catch((error) => {
            this.logger.error(error);
          });
      } else {
        this.sendSQSMessage(queue, messages).catch((error) => {
          this.logger.error(error);
        });
      }
    } else {
      await this.sendSQSMessage(queue, messages);
    }
  }

  private async sendSQSMessage(
    queue: keyof Config["queueWorkers"],
    messages: { id: string; body: any; groupId: string }[] | { body: any; groupId: string }
  ) {
    const queueUrl = this.config.queueWorkers[queue].endpoint;
    if (Array.isArray(messages)) {
      for (const batch of chunk(messages, 10)) {
        await this.sqs.send(
          new SendMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: batch.map(({ id, body, groupId }) => ({
              Id: this.hash(id),
              MessageBody: JSON.stringify(body),
              MessageGroupId: this.hash(groupId),
            })),
          })
        );
      }
    } else {
      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(messages.body),
          MessageGroupId: messages.groupId,
        })
      );
    }
  }

  async enqueueEvents(events: MaybeArray<PetitionEvent | SystemEvent>, t?: Knex.Transaction) {
    const _events = unMaybeArray(events).filter(isDefined);
    if (_events.length > 0) {
      await this.enqueueMessages(
        "event-processor",
        _events.map((event) => ({
          id: `event-processor-${event.id}`,
          groupId: `event-processor-${event.id}`,
          body: event,
        })),
        t
      );
    }
  }

  /**
   * Creates a user in Cognito (or gets it if already exists) and returns the cognito Id
   */
  async getOrCreateCognitoUser(
    email: string,
    password: string | null,
    firstName: string,
    lastName: string,
    clientMetadata: {
      organizationName: string;
      organizationUser: string;
      locale: string;
    },
    sendEmail?: boolean
  ) {
    try {
      const user = await this.getUser(email);
      return user.Username!;
    } catch (error: any) {
      if (error.code === "UserNotFoundException") {
        const res = await this.cognitoIdP
          .adminCreateUser({
            UserPoolId: this.config.cognito.defaultPoolId,
            Username: email,
            TemporaryPassword: password ?? undefined,
            MessageAction: sendEmail ? undefined : "SUPPRESS",
            UserAttributes: [
              { Name: "email", Value: email },
              { Name: "given_name", Value: firstName },
              { Name: "family_name", Value: lastName },
            ],
            ClientMetadata: clientMetadata,
          })
          .promise();
        return res.User!.Username!;
      } else {
        throw error;
      }
    }
  }

  /** resends the email with temporary password to an already existing user */
  async resetUserPassword(
    email: string,
    clientMetadata: { organizationName: string; organizationUser: string; locale: string }
  ) {
    await this.cognitoIdP
      .adminCreateUser({
        UserPoolId: this.config.cognito.defaultPoolId,
        Username: email,
        MessageAction: "RESEND",
        ClientMetadata: clientMetadata,
      })
      .promise();
  }

  /**
    signs up a user in AWS Cognito, and returns the new user's cognito_id
  */
  async signUpUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    clientMetadata: { locale: string }
  ) {
    const res = await this.cognitoIdP
      .signUp({
        Username: email,
        Password: password,
        ClientId: this.config.cognito.clientId,
        ClientMetadata: clientMetadata,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "given_name", Value: firstName },
          { Name: "family_name", Value: lastName },
        ],
      })
      .promise();

    return res.UserSub;
  }

  async deleteUser(email: string) {
    await this.cognitoIdP
      .adminDeleteUser({
        Username: email,
        UserPoolId: this.config.cognito.defaultPoolId,
      })
      .promise();
  }

  async getUser(email: string) {
    return await this.cognitoIdP
      .adminGetUser({
        Username: email,
        UserPoolId: this.config.cognito.defaultPoolId,
      })
      .promise();
  }

  async forgotPassword(email: string, clientMetadata: { locale: string }) {
    await this.cognitoIdP
      .forgotPassword({
        ClientId: this.config.cognito.clientId,
        Username: email,
        ClientMetadata: clientMetadata,
      })
      .promise();
  }

  async resendVerificationCode(email: string, clientMetadata: { locale: string }) {
    await this.cognitoIdP
      .resendConfirmationCode({
        ClientId: this.config.cognito.clientId,
        Username: email,
        ClientMetadata: clientMetadata,
      })
      .promise();
  }
}
