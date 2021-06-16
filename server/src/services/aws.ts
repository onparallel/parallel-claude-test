import AWS from "aws-sdk";
import { createHash } from "crypto";
import { inject, injectable, interfaces } from "inversify";
import { chunk } from "remeda";
import { Memoize } from "typescript-memoize";
import { Config, CONFIG } from "../config";
import { LOGGER, Logger } from "./logger";
import { IStorage, Storage, STORAGE_FACTORY } from "./storage";

export interface IAws {
  publicFiles: IStorage;
  fileUploads: IStorage;
  enqueueMessages(
    queue: keyof Config["queueWorkers"],
    messages:
      | { id: string; body: any; groupId: string }[]
      | { body: any; groupId: string }
  ): Promise<void>;
  createCognitoUser(
    email: string,
    password?: string,
    sendEmail?: boolean
  ): Promise<string | undefined>;
}

export const AWS_SERVICE = Symbol.for("AWS_SERVICE");

@injectable()
export class Aws implements IAws {
  @Memoize() private get s3() {
    return new AWS.S3({
      signatureVersion: "v4",
      region: this.config.aws.region,
      useAccelerateEndpoint: true,
    });
  }

  @Memoize() private get sqs() {
    return new AWS.SQS();
  }

  @Memoize() private get logs() {
    return new AWS.CloudWatchLogs();
  }

  @Memoize() private get cognitoIdP() {
    return new AWS.CognitoIdentityServiceProvider();
  }

  @Memoize() public get fileUploads() {
    return this.storageFactory(
      this.s3,
      this.config.s3.fileUploadsBucketName
    ) as Storage;
  }

  @Memoize() public get temporaryFiles() {
    return this.storageFactory(
      this.s3,
      this.config.s3.temporaryFilesBucketName
    ) as Storage;
  }

  @Memoize() public get publicFiles() {
    return this.storageFactory(
      this.s3,
      this.config.s3.publicFilesBucketName
    ) as Storage;
  }

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: Logger,
    @inject(STORAGE_FACTORY)
    private storageFactory: interfaces.Factory<IStorage>
  ) {
    AWS.config.update({
      ...config.aws,
      signatureVersion: "v4",
      logger:
        process.env.NODE_ENV === "production"
          ? undefined
          : { log: logger.debug.bind(logger) },
    });
  }

  private hash(value: string) {
    return createHash("md5").update(value).digest("hex");
  }

  async enqueueMessages(
    queue: keyof Config["queueWorkers"],
    messages:
      | { id: string; body: any; groupId: string }[]
      | { body: any; groupId: string }
  ) {
    const queueUrl = this.config.queueWorkers[queue].endpoint;
    if (Array.isArray(messages)) {
      for (const batch of chunk(messages, 10)) {
        await this.sqs
          .sendMessageBatch({
            QueueUrl: queueUrl,
            Entries: batch.map(({ id, body, groupId }) => ({
              Id: this.hash(id),
              MessageBody: JSON.stringify(body),
              MessageGroupId: this.hash(groupId),
            })),
          })
          .promise();
      }
    } else {
      await this.sqs
        .sendMessage({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(messages.body),
          MessageGroupId: messages.groupId,
        })
        .promise();
    }
  }

  /**
   * Creates a user in Cognito and returns the cognito Id
   */
  async createCognitoUser(
    email: string,
    password?: string,
    sendEmail?: boolean
  ) {
    const res = await this.cognitoIdP
      .adminCreateUser({
        UserPoolId: this.config.cognito.defaultPoolId,
        Username: email,
        TemporaryPassword: password,
        MessageAction: sendEmail ? undefined : "SUPPRESS",
        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },
          {
            Name: "email_verified",
            Value: "True",
          },
        ],
      })
      .promise();
    return res.User!.Username;
  }

  async resetUserPassword(email: string) {
    const res = await this.cognitoIdP
      .adminResetUserPassword({
        UserPoolId: this.config.cognito.defaultPoolId,
        Username: email,
      })
      .promise();
    return res.$response;
  }
}
