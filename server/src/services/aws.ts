import { inject, injectable, interfaces } from "inversify";
import { Config, CONFIG } from "../config";
import AWS from "aws-sdk";
import { chunk } from "remeda";
import { LOGGER, Logger } from "./logger";
import { createHash } from "crypto";
import { Memoize } from "typescript-memoize";
import { Storage, STORAGE_FACTORY } from "./storage";

@injectable()
export class Aws {
  @Memoize() public get s3() {
    return new AWS.S3({
      signatureVersion: "v4",
      region: this.config.aws.region,
      useAccelerateEndpoint: true,
    });
  }

  @Memoize() public get sqs() {
    return new AWS.SQS();
  }

  @Memoize() public get logs() {
    return new AWS.CloudWatchLogs();
  }

  @Memoize() public get cognitoIdP() {
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

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: Logger,
    @inject(STORAGE_FACTORY) private storageFactory: interfaces.Factory<Storage>
  ) {
    AWS.config.update({
      ...config.aws,
      signatureVersion: "v4",
      logger:
        process.env.NODE_ENV === "production"
          ? undefined
          : {
              log(message) {
                logger.debug(message);
              },
            },
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
  async createCognitoUser(email: string, password: string) {
    const res = await this.cognitoIdP
      .adminCreateUser({
        UserPoolId: this.config.cognito.defaultPoolId,
        Username: email,
        TemporaryPassword: password,
        MessageAction: "SUPPRESS",
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
}
