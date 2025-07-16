import DataLoader from "dataloader";
import { resolveMx } from "dns/promises";
import emailProviders from "email-providers/all.json";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import pMap from "p-map";
import { assert } from "ts-essentials";
import { OrganizationUsageLimitName } from "../db/__types";
import {
  PetitionRepository,
  type PetitionSignatureConfigSigner,
} from "../db/repositories/PetitionRepository";
import { ProfilesExpiringPropertiesEmailProps } from "../emails/emails/app/ProfilesExpiringPropertiesEmail";
import { isValidEmail } from "../graphql/helpers/validators/validEmail";
import { Maybe, MaybeArray, unMaybeArray } from "../util/types";
import { EmailPayload } from "../workers/email-sender";
import { QUEUES_SERVICE, QueuesService } from "./QueuesService";

export interface IEmailsService {
  sendPetitionMessageEmail(messageIds: MaybeArray<number>): Promise<void>;
  sendPetitionReminderEmail(reminderIds: MaybeArray<number>): Promise<void>;
  sendPetitionCompletedEmail(
    petitionId: number,
    {
      accessId,
      signer,
    }: {
      accessId?: number;
      signer?: PetitionSignatureConfigSigner;
    },
    completedBy: string,
  ): Promise<void>;
  sendPetitionCommentsContactNotificationEmail(
    petitionId: number,
    accessIds: number,
    commentIds: number[],
  ): Promise<void>;
  sendPetitionCommentsUserNotificationEmail(
    petitionId: number,
    userId: number,
    commentIds: number[],
  ): Promise<void>;
  sendPetitionSharedEmail(
    userId: number,
    petitionPermissionIds: MaybeArray<number>,
    message: Maybe<string>,
  ): Promise<void>;
  sendPetitionClosedEmail(
    petitionId: number,
    userId: number,
    emailBody: any,
    attachPdfExport: boolean,
    pdfExportTitle: Maybe<string>,
    petitionEventIds: MaybeArray<number>,
  ): Promise<void>;
  sendPetitionMessageBouncedEmail(emailLogId: number): Promise<void>;
  sendContactAuthenticationRequestEmail(
    requestId: number,
    isContactVerification: boolean,
  ): Promise<void>;
  sendAccessDelegatedEmail(
    petitionId: number,
    originalAccessId: number,
    newAccessId: number,
    messageBody: string,
  ): Promise<void>;
  sendDeveloperWebhookFailedEmail(
    eventSubscriptionId: number,
    errorMessage: string,
    postBody: any,
  ): Promise<void>;
  sendPublicPetitionLinkAccessEmail(messageIds: MaybeArray<number>): Promise<void>;
  sendOrganizationLimitsReachedEmail(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    used: number,
    t?: Knex.Transaction,
  ): Promise<void>;
  validateEmail(email: string): Promise<boolean>;
  sendAppSumoActivateAccountEmail(redirectUrl: string, email: string): Promise<void>;
  sendInternalSignaturitAccountDepletedCreditsEmail(
    orgId: number,
    petitionId: number,
    apiKeyHint: string,
  ): Promise<void>;
  sendSignatureCancelledNoCreditsLeftEmail(petitionSignatureRequestId: number): Promise<void>;
  sendSignatureCancelledRequestErrorEmail(petitionSignatureRequestId: number): Promise<void>;
  sendSignatureCancelledDeclinedBySignerEmail(petitionSignatureRequestId: number): Promise<void>;
  sendTransferParallelsEmail(userExternalId: string, orgId: number): Promise<void>;
  sendProfilesExpiringPropertiesEmail(
    userId: number,
    payload: Pick<ProfilesExpiringPropertiesEmailProps, "organizationName" | "properties">,
  ): Promise<void>;
  sendBackgroundCheckMonitoringChangesEmail(
    userId: number,
    profileFieldValues: { profileId: number; profileTypeFieldId: number }[],
  ): Promise<void>;
  sendPetitionApprovalRequestStepPendingEmail(
    approvalRequestStepId: number,
    petitionCommentId: number | null,
    userId: number,
  ): Promise<void>;
  sendPetitionApprovalRequestStepReminderEmail(
    approvalRequestStepId: number,
    userId: number,
  ): Promise<void>;
  sendPetitionApprovalRequestStepApprovedEmail(
    approvalRequestStepId: number,
    petitionCommentId: number,
    userId: number,
  ): Promise<void>;
  sendPetitionApprovalRequestStepRejectedEmail(
    approvalRequestStepId: number,
    rejectionType: "TEMPORARY" | "DEFINITIVE",
    petitionCommentId: number,
    userId: number,
  ): Promise<void>;
  sendPetitionApprovalRequestStepCanceledEmail(
    approvalRequestStepId: number,
    userId: number,
  ): Promise<void>;
  onPetitionMessageBounced(petitionMessageId: number, updatedBy: string): Promise<void>;
  onPetitionReminderBounced(petitionReminderId: number, updatedBy: string): Promise<void>;
}
export const EMAILS = Symbol.for("EMAILS");

@injectable()
export class EmailsService implements IEmailsService {
  constructor(
    @inject(QUEUES_SERVICE) private queues: QueuesService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
  ) {}

  private async enqueueEmail<T extends keyof EmailPayload>(
    type: T,
    data: MaybeArray<EmailPayload[T] & { id: string }>,
    t?: Knex.Transaction,
  ) {
    const payloads = unMaybeArray(data);
    await this.queues.enqueueMessages(
      "email-sender",
      payloads.map((p) => ({
        id: p.id,
        body: { type, payload: p } as any,
        groupId: p.id,
      })),
      t,
    );
  }

  private buildQueueId(prefix: string, ids: MaybeArray<number | string>) {
    return `${prefix}-${unMaybeArray(ids).join(",")}`;
  }

  async sendPetitionMessageEmail(messageIds: MaybeArray<number>) {
    return await this.enqueueEmail(
      "petition-message",
      unMaybeArray(messageIds).map((messageId) => ({
        id: this.buildQueueId("PetitionMessage", messageId),
        petition_message_id: messageId,
      })),
    );
  }

  async sendPetitionReminderEmail(reminderIds: MaybeArray<number>) {
    return await this.enqueueEmail(
      "petition-reminder",
      unMaybeArray(reminderIds).map((reminderId) => ({
        id: this.buildQueueId("PetitionReminder", reminderId),
        petition_reminder_id: reminderId,
      })),
    );
  }

  async sendPetitionCompletedEmail(
    petitionId: number,
    {
      accessId,
      signer,
    }: {
      accessId?: number;
      signer?: PetitionSignatureConfigSigner;
    },
    completedBy: string,
  ) {
    if (!accessId && !signer) {
      return;
    }
    const payload = accessId
      ? {
          id: this.buildQueueId("PetitionAccess", accessId),
          petition_id: petitionId,
          petition_access_id: accessId,
          completed_by: completedBy,
        }
      : {
          id: this.buildQueueId("PetitionSigned", petitionId),
          petition_id: petitionId,
          signer,
          completed_by: completedBy,
        };
    return await this.enqueueEmail("petition-completed", payload);
  }

  async sendPetitionCommentsContactNotificationEmail(
    petitionId: number,
    accessId: number,
    commentIds: number[],
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
    commentIds: number[],
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
    message: Maybe<string>,
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
    emailBody: any,
    attachPdfExport: boolean,
    pdfExportTitle: Maybe<string>,
    petitionEventIds: MaybeArray<number>,
  ) {
    return await this.enqueueEmail("petition-closed-notification", {
      id: this.buildQueueId("PetitionClosedNotification", petitionEventIds),
      petition_event_ids: unMaybeArray(petitionEventIds),
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

  async sendContactAuthenticationRequestEmail(requestId: number, isContactVerification: boolean) {
    return await this.enqueueEmail("contact-authentication-request", {
      id: this.buildQueueId("ContactAuthenticationRequest", requestId),
      contact_authentication_request_id: requestId,
      is_contact_verification: isContactVerification,
    });
  }

  async sendAccessDelegatedEmail(
    petitionId: number,
    originalAccessId: number,
    newAccessId: number,
    messageBody: string,
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
    eventSubscriptionId: number,
    errorMessage: string,
    postBody: any,
  ) {
    return await this.enqueueEmail("developer-webhook-failed", {
      id: this.buildQueueId("DeveloperWebhookFailed", eventSubscriptionId),
      event_subscription_id: eventSubscriptionId,
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
      })),
    );
  }

  async sendOrganizationLimitsReachedEmail(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    used: number,
    t?: Knex.Transaction,
  ) {
    return await this.enqueueEmail(
      "organization-limits-reached",
      {
        id: this.buildQueueId(`Organization:${limitName}`, [orgId, used]),
        org_id: orgId,
        limit_name: limitName,
      },
      t,
    );
  }

  async sendAppSumoActivateAccountEmail(redirectUrl: string, email: string) {
    return await this.enqueueEmail("appsumo-activate-account", {
      id: this.buildQueueId("AppSumoActivation", email),
      email,
      redirectUrl,
    });
  }

  async sendInternalSignaturitAccountDepletedCreditsEmail(
    orgId: number,
    petitionId: number,
    apiKeyHint: string,
  ) {
    return await this.enqueueEmail("internal-signaturit-account-depleted-credits", {
      id: this.buildQueueId("InternalSignaturitAccountDepletedCredits", [orgId, apiKeyHint]),
      orgId,
      petitionId,
      apiKeyHint,
    });
  }

  async sendTransferParallelsEmail(userExternalId: string, orgId: number) {
    return await this.enqueueEmail("transfer-parallels", {
      id: this.buildQueueId("TransferParallels", [userExternalId, orgId]),
      userExternalId,
      orgId,
    });
  }

  /**
   * notify users subscribed to petition that the signature request was cancelled due to lack of signature credits
   */
  async sendSignatureCancelledNoCreditsLeftEmail(petitionSignatureRequestId: number) {
    return await this.enqueueEmail("signature-cancelled-no-credits-left", {
      id: this.buildQueueId("SignatureCancelledNoCreditsLeft", petitionSignatureRequestId),
      petition_signature_request_id: petitionSignatureRequestId,
    });
  }

  async sendSignatureCancelledRequestErrorEmail(petitionSignatureRequestId: number) {
    return await this.enqueueEmail("signature-cancelled-request-error", {
      id: this.buildQueueId("SignatureCancelledRequestError", petitionSignatureRequestId),
      petition_signature_request_id: petitionSignatureRequestId,
    });
  }

  async sendSignatureCancelledDeclinedBySignerEmail(petitionSignatureRequestId: number) {
    return await this.enqueueEmail("signature-cancelled-declined-by-signer", {
      id: this.buildQueueId("SignatureCancelledDeclinedBySigner", petitionSignatureRequestId),
      petition_signature_request_id: petitionSignatureRequestId,
    });
  }

  async sendProfilesExpiringPropertiesEmail(
    userId: number,
    payload: Pick<ProfilesExpiringPropertiesEmailProps, "organizationName" | "properties">,
  ): Promise<void> {
    return await this.enqueueEmail("profiles-expiring-properties", {
      id: this.buildQueueId("ProfilesExpiringProperties", userId),
      userId,
      ...payload,
    });
  }

  async sendBackgroundCheckMonitoringChangesEmail(
    userId: number,
    profileFieldValues: { profileId: number; profileTypeFieldId: number }[],
  ) {
    return await this.enqueueEmail("background-check-monitoring-changes", {
      id: this.buildQueueId("BackgroundCheckMonitoringChanges", [
        userId,
        ...profileFieldValues.map((pfv) => `${pfv.profileId}-${pfv.profileTypeFieldId}`),
      ]),
      userId,
      profileFieldValues,
    });
  }

  async sendPetitionApprovalRequestStepPendingEmail(
    approvalRequestStepId: number,
    petitionCommentId: number | null,
    userId: number,
  ) {
    return await this.enqueueEmail("petition-approval-request-step-pending", {
      id: this.buildQueueId("PetitionApprovalRequestStepPending", [approvalRequestStepId, userId]),
      petition_approval_request_step_id: approvalRequestStepId,
      petition_comment_id: petitionCommentId,
      user_id: userId,
      is_reminder: false,
    });
  }

  async sendPetitionApprovalRequestStepReminderEmail(
    approvalRequestStepId: number,
    userId: number,
  ) {
    return await this.enqueueEmail("petition-approval-request-step-pending", {
      id: this.buildQueueId("PetitionApprovalRequestStepPending", [approvalRequestStepId, userId]),
      petition_approval_request_step_id: approvalRequestStepId,
      petition_comment_id: null,
      user_id: userId,
      is_reminder: true,
    });
  }

  async sendPetitionApprovalRequestStepApprovedEmail(
    approvalRequestStepId: number,
    petitionCommentId: number,
    userId: number,
  ) {
    return await this.enqueueEmail("petition-approval-request-step-finished", {
      id: this.buildQueueId("PetitionApprovalRequestStepApproved", [approvalRequestStepId, userId]),
      petition_approval_request_step_id: approvalRequestStepId,
      petition_comment_id: petitionCommentId,
      user_id: userId,
    });
  }

  async sendPetitionApprovalRequestStepRejectedEmail(
    approvalRequestStepId: number,
    rejectionType: "TEMPORARY" | "DEFINITIVE",
    petitionCommentId: number,
    userId: number,
  ) {
    return await this.enqueueEmail("petition-approval-request-step-finished", {
      id: this.buildQueueId("PetitionApprovalRequestStepRejected", [approvalRequestStepId, userId]),
      petition_approval_request_step_id: approvalRequestStepId,
      petition_comment_id: petitionCommentId,
      user_id: userId,
      rejection_type: rejectionType,
    });
  }

  async sendPetitionApprovalRequestStepCanceledEmail(
    approvalRequestStepId: number,
    userId: number,
  ) {
    return await this.enqueueEmail("petition-approval-request-step-canceled", {
      id: this.buildQueueId("PetitionApprovalRequestStepCanceled", [approvalRequestStepId, userId]),
      petition_approval_request_step_id: approvalRequestStepId,
      user_id: userId,
    });
  }

  private readonly resolveMx = (() => {
    const knownProviders = new Set(emailProviders);
    return new DataLoader<string, boolean>(async (domains) => {
      return await pMap(
        domains,
        async (domain) => {
          try {
            if (knownProviders.has(domain) || (await resolveMx(domain))) {
              return true;
            }
          } catch {}
          return false;
        },
        { concurrency: 20 },
      );
    });
  })();

  async validateEmail(email: string) {
    return isValidEmail(email) && (await this.resolveMx.load(email.split("@")[1]));
  }

  async onPetitionMessageBounced(petitionMessageId: number, updatedBy: string) {
    const message = await this.petitions.loadMessage(petitionMessageId);
    assert(message, `Message ${petitionMessageId} not found`);

    await this.petitions.markPetitionAccessEmailBounceStatus(
      message.petition_access_id,
      true,
      updatedBy,
    );
    await this.petitions.deactivateAccesses(
      message.petition_id,
      [message.petition_access_id],
      updatedBy,
    );
    await this.sendPetitionMessageBouncedEmail(message.id);
    await this.petitions.createEvent({
      type: "PETITION_MESSAGE_BOUNCED",
      data: { petition_message_id: message.id },
      petition_id: message.petition_id,
    });
  }

  async onPetitionReminderBounced(petitionReminderId: number, updatedBy: string) {
    const reminder = await this.petitions.loadReminder(petitionReminderId);
    assert(reminder, `Reminder ${petitionReminderId} not found`);
    const access = await this.petitions.loadAccess(reminder.petition_access_id);
    assert(access, `Access ${reminder.petition_access_id} not found`);

    await this.petitions.markPetitionAccessEmailBounceStatus(access.id, true, updatedBy);
    await this.petitions.updateRemindersForPetitions(access.petition_id, null);
    await this.petitions.cancelScheduledMessagesByAccessIds([access.id]);
    await this.petitions.createEvent({
      type: "PETITION_REMINDER_BOUNCED",
      data: {
        petition_reminder_id: reminder.id,
      },
      petition_id: access.petition_id,
    });
  }
}
