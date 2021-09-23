import { inject, injectable } from "inversify";
import { unMaybeArray } from "../util/arrays";
import { MaybeArray, Maybe } from "../util/types";
import { Aws, AWS_SERVICE } from "./aws";
import { EmailPayload } from "../workers/email-sender";

export interface IEmailsService {
  sendPetitionMessageEmail(messageIds: MaybeArray<number>): Promise<void>;
  sendPetitionReminderEmail(reminderIds: MaybeArray<number>): Promise<void>;
  sendPetitionCompletedEmail(
    petitionId: number,
    {
      accessIds,
      contactId,
    }: {
      accessIds?: MaybeArray<number>;
      contactId?: number;
    }
  ): Promise<void>;
  sendPetitionCommentsContactNotificationEmail(
    petitionId: number,
    accessIds: number,
    commentIds: number[]
  ): Promise<void>;
  sendPetitionCommentsUserNotificationEmail(
    petitionId: number,
    userId: number,
    commentIds: number[]
  ): Promise<void>;
  sendPetitionSharedEmail(
    userId: number,
    petitionPermissionIds: MaybeArray<number>,
    message: Maybe<string>
  ): Promise<void>;
  sendPetitionClosedEmail(
    petitionId: number,
    userId: number,
    petitionAccessIds: MaybeArray<number>,
    emailBody: any,
    attachPdfExport: boolean,
    pdfExportTitle: Maybe<string>
  ): Promise<void>;
  sendPetitionMessageBouncedEmail(emailLogId: number): Promise<void>;
  sendContactAuthenticationRequestEmail(requestId: number): Promise<void>;
  sendPublicPetitionLinkAccessEmail(messageIds: MaybeArray<number>): Promise<void>;
}
export const EMAILS = Symbol.for("EMAILS");

@injectable()
export class EmailsService implements IEmailsService {
  constructor(@inject(AWS_SERVICE) private aws: Aws) {}

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

  async sendPetitionCompletedEmail(
    petitionId: number,
    {
      accessId,
      contactId,
    }: {
      accessId?: number;
      contactId?: number;
    }
  ) {
    if (!accessId && !contactId) {
      return;
    }
    const payload = accessId
      ? {
          id: this.buildQueueId("PetitionAccess", accessId),
          petition_id: petitionId,
          petition_access_id: accessId,
        }
      : {
          id: this.buildQueueId("PetitionSigned", petitionId),
          petition_id: petitionId,
          signer_contact_id: contactId,
        };
    return await this.enqueueEmail("petition-completed", payload);
  }

  async sendPetitionCommentsContactNotificationEmail(
    petitionId: number,
    accessId: number,
    commentIds: number[]
  ) {
    return await this.enqueueEmail("comments-contact-notification", {
      id: this.buildQueueId("PetitionFieldCommentContact", [petitionId, accessId, ...commentIds]),
      petition_id: petitionId,
      petition_field_comment_ids: commentIds,
      petition_access_id: accessId,
    });
  }

  async sendPetitionCommentsUserNotificationEmail(
    petitionId: number,
    userId: number,
    commentIds: number[]
  ) {
    return await this.enqueueEmail("comments-user-notification", {
      id: this.buildQueueId("PetitionFieldCommentUser", [petitionId, userId, ...commentIds]),
      user_id: userId,
      petition_id: petitionId,
      petition_field_comment_ids: commentIds,
    });
  }

  async sendPetitionSharedEmail(
    userId: number,
    petitionPermissionIds: MaybeArray<number>,
    message: Maybe<string>
  ) {
    return await this.enqueueEmail("petition-shared", {
      id: this.buildQueueId("PetitionAccess", petitionPermissionIds),
      user_id: userId,
      petition_permission_ids: unMaybeArray(petitionPermissionIds),
      message,
    });
  }

  async sendPetitionClosedEmail(
    petitionId: number,
    userId: number,
    petitionAccessIds: MaybeArray<number>,
    emailBody: any,
    attachPdfExport: boolean,
    pdfExportTitle: Maybe<string>
  ) {
    return await this.enqueueEmail("petition-closed-notification", {
      id: this.buildQueueId("PetitionClosedNotification", petitionAccessIds),
      petition_access_ids: unMaybeArray(petitionAccessIds),
      petition_id: petitionId,
      user_id: userId,
      message: emailBody,
      attach_pdf_export: attachPdfExport,
      pdf_export_title: pdfExportTitle,
    });
  }

  async sendPetitionMessageBouncedEmail(petitionMessageId: number) {
    return await this.enqueueEmail("petition-message-bounced", {
      id: this.buildQueueId("PetitionMessageBounced", petitionMessageId),
      petition_message_id: petitionMessageId,
    });
  }

  async sendContactAuthenticationRequestEmail(requestId: number) {
    return await this.enqueueEmail("contact-authentication-request", {
      id: this.buildQueueId("ContactAuthenticationRequest", requestId),
      contact_authentication_request_id: requestId,
    });
  }

  async sendAccessDelegatedEmail(
    petitionId: number,
    originalAccessId: number,
    newAccessId: number,
    messageBody: any
  ) {
    return await this.enqueueEmail("petition-access-delegated", {
      id: this.buildQueueId("PetitionAccessDelegated", [originalAccessId, newAccessId]),
      petition_id: petitionId,
      original_access_id: originalAccessId,
      new_access_id: newAccessId,
      message_body: messageBody,
    });
  }

  async sendDeveloperWebhookFailedEmail(
    subscriptionId: number,
    errorMessage: string,
    postBody: any
  ) {
    return await this.enqueueEmail("developer-webhook-failed", {
      id: this.buildQueueId("DeveloperWebhookFailed", subscriptionId),
      petition_subscription_id: subscriptionId,
      error_message: errorMessage,
      post_body: postBody,
    });
  }

  async sendPublicPetitionLinkAccessEmail(messageIds: MaybeArray<number>) {
    return await this.enqueueEmail(
      "public-petition-link-access",
      unMaybeArray(messageIds).map((messageId) => ({
        id: this.buildQueueId("PublicPetitionLinkAccess", messageId),
        petition_message_id: messageId,
      }))
    );
  }
}
