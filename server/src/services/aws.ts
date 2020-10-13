import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import AWS from "aws-sdk";
import contentDisposition from "content-disposition";
import { chunk } from "remeda";
import { LOGGER, Logger } from "./logger";
import { createHash } from "crypto";

@injectable()
export class Aws {
  private _s3?: AWS.S3;
  public get s3() {
    if (!this._s3) {
      this._s3 = new AWS.S3({
        signatureVersion: "v4",
        region: this.config.aws.region,
        useAccelerateEndpoint: true,
      });
    }
    return this._s3;
  }

  private _sqs?: AWS.SQS;
  public get sqs() {
    if (!this._sqs) {
      this._sqs = new AWS.SQS();
    }
    return this._sqs;
  }

  private _logs?: AWS.CloudWatchLogs;
  public get logs() {
    if (!this._logs) {
      this._logs = new AWS.CloudWatchLogs();
    }
    return this._logs;
  }

  private _cognitoIdP?: AWS.CognitoIdentityServiceProvider;
  public get cognitoIdP() {
    if (!this._cognitoIdP) {
      this._cognitoIdP = new AWS.CognitoIdentityServiceProvider();
    }
    return this._cognitoIdP;
  }

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: Logger
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

  async getSignedUploadEndpoint(key: string, contentType: string) {
    return await this.s3.getSignedUrlPromise("putObject", {
      Bucket: this.config.s3.uplodsBucketName,
      Key: key,
      ContentType: contentType,
      Expires: 60 * 30,
    });
  }

  async getFileMetadata(key: string) {
    return this.s3
      .headObject({
        Bucket: this.config.s3.uplodsBucketName,
        Key: key,
      })
      .promise();
  }

  async deleteFile(key: string) {
    this.s3
      .deleteObject({
        Bucket: this.config.s3.uplodsBucketName,
        Key: key,
      })
      .promise();
  }

  async getSignedDownloadEndpoint(
    key: string,
    filename: string,
    cdType: "attachment" | "inline"
  ) {
    return await this.s3.getSignedUrlPromise("getObject", {
      Bucket: this.config.s3.uplodsBucketName,
      Key: key,
      Expires: 60 * 30,
      ResponseContentDisposition: contentDisposition(filename, {
        type: cdType,
      }),
    });
  }

  downloadFile(key: string) {
    return this.s3
      .getObject({
        Bucket: this.config.s3.uplodsBucketName,
        Key: key,
      })
      .createReadStream();
  }

  async createCognitoUser(email: string) {
    const res = await this.cognitoIdP
      .adminCreateUser({
        UserPoolId: this.config.cognito.defaultPoolId,
        Username: email,
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
    // return cognito id
    return res.User!.Username;
  }
}
