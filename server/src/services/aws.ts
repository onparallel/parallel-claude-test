import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import AWS from "aws-sdk";
import contentDisposition from "content-disposition";
import { chunk } from "remeda";
import { LOGGER, Logger } from "./logger";
import { EmailPayload } from "../workers/emails/types";
import { MaybeArray } from "../util/types";
import { unMaybeArray } from "../util/arrays";

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

  private async enqueueMessages(
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
              Id: id,
              MessageBody: JSON.stringify(body),
              MessageGroupId: groupId,
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

  private async enqueueEmail<T extends keyof EmailPayload>(
    type: T,
    data: MaybeArray<EmailPayload[T] & { id: string }>
  ) {
    const payloads = unMaybeArray(data);
    await this.enqueueMessages(
      "email-sender",
      payloads.map((p) => ({
        id: p.id,
        body: { type, payload: p },
        groupId: p.id,
      }))
    );
  }

  private buildQueueId(prefix: string, ids: number[]) {
    return `${prefix}-${ids.join("-")}`;
  }

  async enqueuePetitionMessages(messageIds: number[]) {
    return await this.enqueueEmail(
      "petition-message",
      messageIds.map((id) => ({
        id: this.buildQueueId("PetitionMessage", [id]),
        petition_message_id: id,
      }))
    );
  }

  async enqueueReminders(ids: number[]) {
    return await this.enqueueEmail(
      "petition-reminder",
      ids.map((id) => ({
        id: this.buildQueueId("PetitionReminder", [id]),
        petition_reminder_id: id,
      }))
    );
  }

  async enqueuePetitionCompleted(accessId: number) {
    return await this.enqueueEmail("petition-completed", {
      id: this.buildQueueId("PetitionAccess", [accessId]),
      petition_access_id: accessId,
    });
  }

  async enqueuePetitionCommentsContactNotification(
    petitionId: number,
    userId: number,
    accessIds: number[],
    commentIds: number[]
  ) {
    return await this.enqueueEmail("comments-contact-notification", {
      id: this.buildQueueId("PetitionFieldCommentContact", [
        ...commentIds,
        ...accessIds,
      ]),
      petition_id: petitionId,
      user_id: userId,
      petition_access_ids: accessIds,
      petition_field_comment_ids: commentIds,
    });
  }

  async enqueuePetitionCommentsUserNotification(
    petitionId: number,
    accessId: number,
    userIds: number[],
    commentIds: number[]
  ) {
    return await this.enqueueEmail("comments-user-notification", {
      id: this.buildQueueId("PetitionFieldCommentUser", [
        ...commentIds,
        ...userIds,
      ]),
      petition_id: petitionId,
      petition_access_id: accessId,
      user_ids: userIds,
      petition_field_comment_ids: commentIds,
    });
  }
}
