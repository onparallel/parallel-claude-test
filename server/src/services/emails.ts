import { injectable } from "inversify";
import { unMaybeArray } from "../util/arrays";
import { MaybeArray, Maybe } from "../util/types";
import { Aws } from "./aws";
import { EmailPayload } from "../workers/email-sender";

export interface IEmailsService {
  sendPetitionMessageEmail(messageIds: MaybeArray<number>): Promise<void>;
  sendPetitionReminderEmail(reminderIds: MaybeArray<number>): Promise<void>;
  sendPetitionCompletedEmail(accessIds: MaybeArray<number>): Promise<void>;
  sendPetitionCommentsContactNotificationEmail(
    petitionId: number,
    userId: number,
    accessIds: number[],
    commentIds: number[]
  ): Promise<void>;
  sendPetitionCommentsUserNotificationEmail(
    petitionId: number,
    authorId: number, // can be User (isInternal = true) or Contact (isInternal = false)
    userIds: number[],
    commentIds: number[],
    isInternal: boolean
  ): Promise<void>;
  sendPetitionSharingNotificationEmail(
    userId: number,
    petitionUserIds: MaybeArray<number>,
    message: Maybe<string>
  ): Promise<void>;
  sendPetitionClosedEmail(
    petitionId: number,
    userId: number,
    petitionAccessIds: MaybeArray<number>,
    emailBody: any
  ): Promise<void>;
}
export const EMAILS = Symbol.for("EMAILS");

@injectable()
export class EmailsService implements IEmailsService {
  constructor(private aws: Aws) {}

  private async enqueueEmail<T extends keyof EmailPayload>(
    type: T,
    data: MaybeArray<EmailPayload[T] & { id: string }>
  ) {
    const payloads = unMaybeArray(data);
    await this.aws.enqueueMessages(
      "email-sender",
      payloads.map((p) => ({
        id: p.id,
        body: { type, payload: p },
        groupId: p.id,
      }))
    );
  }

  private buildQueueId(prefix: string, ids: MaybeArray<number>) {
    return `${prefix}-${unMaybeArray(ids).join(",")}`;
  }

  async sendPetitionMessageEmail(messageIds: MaybeArray<number>) {
    return await this.enqueueEmail(
      "petition-message",
      unMaybeArray(messageIds).map((messageId) => ({
        id: this.buildQueueId("PetitionMessage", messageId),
        petition_message_id: messageId,
      }))
    );
  }

  async sendPetitionReminderEmail(reminderIds: MaybeArray<number>) {
    return await this.enqueueEmail(
      "petition-reminder",
      unMaybeArray(reminderIds).map((reminderId) => ({
        id: this.buildQueueId("PetitionReminder", reminderId),
        petition_reminder_id: reminderId,
      }))
    );
  }

  async sendPetitionCompletedEmail(accessIds: MaybeArray<number>) {
    return await this.enqueueEmail(
      "petition-completed",
      unMaybeArray(accessIds).map((accessId) => ({
        id: this.buildQueueId("PetitionAccess", accessId),
        petition_access_id: accessId,
      }))
    );
  }

  async sendPetitionCommentsContactNotificationEmail(
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

  async sendPetitionCommentsUserNotificationEmail(
    petitionId: number,
    authorId: number,
    userIds: number[],
    commentIds: number[],
    isInternal: boolean
  ) {
    return await this.enqueueEmail("comments-user-notification", {
      id: this.buildQueueId("PetitionFieldCommentUser", [
        ...commentIds,
        ...userIds,
      ]),
      petition_id: petitionId,
      petition_access_id: isInternal ? undefined : authorId,
      author_user_id: isInternal ? authorId : undefined,
      user_ids: userIds,
      petition_field_comment_ids: commentIds,
    });
  }

  async sendPetitionSharingNotificationEmail(
    userId: number,
    petitionUserIds: MaybeArray<number>,
    message: Maybe<string>
  ) {
    return await this.enqueueEmail("petition-sharing-notification", {
      id: this.buildQueueId("PetitionAccess", petitionUserIds),
      user_id: userId,
      petition_user_ids: unMaybeArray(petitionUserIds),
      message,
    });
  }

  async sendPetitionClosedEmail(
    petitionId: number,
    userId: number,
    petitionAccessIds: MaybeArray<number>,
    emailBody: any
  ) {
    return await this.enqueueEmail("petition-closed-notification", {
      id: this.buildQueueId("PetitionClosedNotification", petitionAccessIds),
      petition_access_ids: unMaybeArray(petitionAccessIds),
      petition_id: petitionId,
      user_id: userId,
      message: emailBody,
    });
  }
}
