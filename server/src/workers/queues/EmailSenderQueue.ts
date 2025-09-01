import fastSafeStringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { Config, CONFIG } from "../../config";
import { EmailLog } from "../../db/__types";
import { EmailLogRepository } from "../../db/repositories/EmailLogRepository";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { ILogger, LOGGER } from "../../services/Logger";
import { ISmtp, SMTP } from "../../services/Smtp";
import { IStorageService, STORAGE_SERVICE } from "../../services/StorageService";
import { unMaybeArray } from "../../util/types";
import { QueueWorker } from "../helpers/createQueueWorker";
import { RateLimitGuard } from "../helpers/RateLimitGuard";
import { AppsumoActivateAccountEmailBuilder } from "./email-builders/AppsumoActivateAccountEmailBuilder";
import { BackgroundCheckMonitoringChangesEmailBuilder } from "./email-builders/BackgroundCheckMonitoringChangesEmailBuilder";
import { CommentsContactNotificationEmailBuilder } from "./email-builders/CommentsContactNotificationEmailBuilder";
import { CommentsUserNotificationEmailBuilder } from "./email-builders/CommentsUserNotificationEmailBuilder";
import { ContactAuthenticationRequestEmailBuilder } from "./email-builders/ContactAuthenticationRequestEmailBuilder";
import { DeveloperWebhookFailedEmailBuilder } from "./email-builders/DeveloperWebhookFailedEmailBuilder";
import { InternalSignaturitAccountDepletedCreditsEmailBuilder } from "./email-builders/InternalSignaturitAccountDepletedCreditsEmailBuilder";
import { InvitationEmailBuilder } from "./email-builders/InvitationEmailBuilder";
import { OrganizationLimitsReachedEmailBuilder } from "./email-builders/OrganizationLimitsReachedEmailBuilder";
import { PetitionAccessDelegatedEmailBuilder } from "./email-builders/PetitionAccessDelegatedEmailBuilder";
import { PetitionApprovalRequestStepCanceledEmailBuilder } from "./email-builders/PetitionApprovalRequestStepCanceledEmailBuilder";
import { PetitionApprovalRequestStepFinishedEmailBuilder } from "./email-builders/PetitionApprovalRequestStepFinishedEmailBuilder";
import { PetitionApprovalRequestStepPendingEmailBuilder } from "./email-builders/PetitionApprovalRequestStepPendingEmailBuilder";
import { PetitionClosedNotificationEmailBuilder } from "./email-builders/PetitionClosedNotificationEmailBuilder";
import { PetitionCompletedEmailBuilder } from "./email-builders/PetitionCompletedEmailBuilder";
import { PetitionMessageBouncedEmailBuilder } from "./email-builders/PetitionMessageBouncedEmailBuilder";
import { PetitionMessageEmailBuilder } from "./email-builders/PetitionMessageEmailBuilder";
import { PetitionReminderEmailBuilder } from "./email-builders/PetitionReminderEmailBuilder";
import { PetitionSharedEmailBuilder } from "./email-builders/PetitionSharedEmailBuilder";
import { ProfilesExpiringPropertiesEmailBuilder } from "./email-builders/ProfilesExpiringPropertiesEmailBuilder";
import { PublicPetitionLinkAccessEmailBuilder } from "./email-builders/PublicPetitionLinkAccessEmailBuilder";
import { SendFromDatabaseEmailBuilder } from "./email-builders/SendFromDatabaseEmailBuilder";
import { SignatureCancelledDeclinedBySignerEmailBuilder } from "./email-builders/SignatureCancelledDeclinedBySignerEmailBuilder";
import { SignatureCancelledNoCreditsLeftEmailBuilder } from "./email-builders/SignatureCancelledNoCreditsLeftEmailBuilder";
import { SignatureCancelledRequestErrorEmailBuilder } from "./email-builders/SignatureCancelledRequestErrorEmailBuilder";
import { TransferParallelsEmailBuilder } from "./email-builders/TransferParallelsEmailBuilder";

type Builders = {
  "petition-completed": PetitionCompletedEmailBuilder;
  "comments-user-notification": CommentsUserNotificationEmailBuilder;
  "comments-contact-notification": CommentsContactNotificationEmailBuilder;
  "petition-message": PetitionMessageEmailBuilder;
  "petition-reminder": PetitionReminderEmailBuilder;
  "petition-shared": PetitionSharedEmailBuilder;
  "petition-closed-notification": PetitionClosedNotificationEmailBuilder;
  "petition-message-bounced": PetitionMessageBouncedEmailBuilder;
  "contact-authentication-request": ContactAuthenticationRequestEmailBuilder;
  "petition-access-delegated": PetitionAccessDelegatedEmailBuilder;
  "developer-webhook-failed": DeveloperWebhookFailedEmailBuilder;
  "public-petition-link-access": PublicPetitionLinkAccessEmailBuilder;
  "organization-limits-reached": OrganizationLimitsReachedEmailBuilder;
  "appsumo-activate-account": AppsumoActivateAccountEmailBuilder;
  "internal-signaturit-account-depleted-credits": InternalSignaturitAccountDepletedCreditsEmailBuilder;
  "signature-cancelled-no-credits-left": SignatureCancelledNoCreditsLeftEmailBuilder;
  "signature-cancelled-request-error": SignatureCancelledRequestErrorEmailBuilder;
  "signature-cancelled-declined-by-signer": SignatureCancelledDeclinedBySignerEmailBuilder;
  invitation: InvitationEmailBuilder;
  "from-database": SendFromDatabaseEmailBuilder;
  "transfer-parallels": TransferParallelsEmailBuilder;
  "profiles-expiring-properties": ProfilesExpiringPropertiesEmailBuilder;
  "background-check-monitoring-changes": BackgroundCheckMonitoringChangesEmailBuilder;
  "petition-approval-request-step-pending": PetitionApprovalRequestStepPendingEmailBuilder;
  "petition-approval-request-step-finished": PetitionApprovalRequestStepFinishedEmailBuilder;
  "petition-approval-request-step-canceled": PetitionApprovalRequestStepCanceledEmailBuilder;
};

export interface EmailBuilder<T = any> {
  build(payload: T): Promise<EmailLog[]>;
}

export type EmailPayload = {
  [K in keyof Builders]: Parameters<Builders[K]["build"]>[0];
};

export type EmailSenderWorkerPayload = {
  [K in keyof Builders]: {
    type: K;
    payload: Parameters<Builders[K]["build"]>[0];
  };
}[keyof Builders];

@injectable()
export class EmailSenderQueue extends QueueWorker<EmailSenderWorkerPayload> {
  private builders: Record<keyof Builders, EmailBuilder>;
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: ILogger,
    @inject(SMTP) private smtp: ISmtp,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(EMAILS) private emails: IEmailsService,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
    // ---- BUILDERS ---- //
    @inject(PetitionCompletedEmailBuilder) petitionCompleted: EmailBuilder,
    @inject(CommentsUserNotificationEmailBuilder) commentsUserNotification: EmailBuilder,
    @inject(CommentsContactNotificationEmailBuilder) commentsContactNotification: EmailBuilder,
    @inject(PetitionMessageEmailBuilder) petitionMessage: EmailBuilder,
    @inject(PetitionReminderEmailBuilder) petitionReminder: EmailBuilder,
    @inject(PetitionSharedEmailBuilder) petitionShared: EmailBuilder,
    @inject(PetitionClosedNotificationEmailBuilder) petitionClosedNotification: EmailBuilder,
    @inject(PetitionMessageBouncedEmailBuilder) petitionMessageBounced: EmailBuilder,
    @inject(ContactAuthenticationRequestEmailBuilder) contactAuthenticationRequest: EmailBuilder,
    @inject(PetitionAccessDelegatedEmailBuilder) petitionAccessDelegated: EmailBuilder,
    @inject(DeveloperWebhookFailedEmailBuilder) developerWebhookFailed: EmailBuilder,
    @inject(PublicPetitionLinkAccessEmailBuilder) publicPetitionLinkAccess: EmailBuilder,
    @inject(OrganizationLimitsReachedEmailBuilder) organizationLimitsReached: EmailBuilder,
    @inject(AppsumoActivateAccountEmailBuilder) appsumoActivateAccount: EmailBuilder,
    @inject(InternalSignaturitAccountDepletedCreditsEmailBuilder)
    internalSignaturitAccountDepletedCredits: EmailBuilder,
    @inject(SignatureCancelledNoCreditsLeftEmailBuilder)
    signatureCancelledNoCreditsLeft: EmailBuilder,
    @inject(SignatureCancelledRequestErrorEmailBuilder)
    signatureCancelledRequestError: EmailBuilder,
    @inject(SignatureCancelledDeclinedBySignerEmailBuilder)
    signatureCancelledDeclinedBySigner: EmailBuilder,
    @inject(InvitationEmailBuilder) invitation: EmailBuilder,
    @inject(SendFromDatabaseEmailBuilder) sendFromDatabase: EmailBuilder,
    @inject(TransferParallelsEmailBuilder) transferParallels: EmailBuilder,
    @inject(ProfilesExpiringPropertiesEmailBuilder) profilesExpiringProperties: EmailBuilder,
    @inject(BackgroundCheckMonitoringChangesEmailBuilder)
    backgroundCheckMonitoringChanges: EmailBuilder,
    @inject(PetitionApprovalRequestStepPendingEmailBuilder)
    petitionApprovalRequestStepPending: EmailBuilder,
    @inject(PetitionApprovalRequestStepFinishedEmailBuilder)
    petitionApprovalRequestStepFinished: EmailBuilder,
    @inject(PetitionApprovalRequestStepCanceledEmailBuilder)
    petitionApprovalRequestStepCanceled: EmailBuilder,
  ) {
    super();

    this.builders = {
      "petition-completed": petitionCompleted,
      "comments-user-notification": commentsUserNotification,
      "comments-contact-notification": commentsContactNotification,
      "petition-message": petitionMessage,
      "petition-reminder": petitionReminder,
      "petition-shared": petitionShared,
      "petition-closed-notification": petitionClosedNotification,
      "petition-message-bounced": petitionMessageBounced,
      "contact-authentication-request": contactAuthenticationRequest,
      "petition-access-delegated": petitionAccessDelegated,
      "developer-webhook-failed": developerWebhookFailed,
      "public-petition-link-access": publicPetitionLinkAccess,
      "organization-limits-reached": organizationLimitsReached,
      "appsumo-activate-account": appsumoActivateAccount,
      "internal-signaturit-account-depleted-credits": internalSignaturitAccountDepletedCredits,
      "signature-cancelled-no-credits-left": signatureCancelledNoCreditsLeft,
      "signature-cancelled-request-error": signatureCancelledRequestError,
      "signature-cancelled-declined-by-signer": signatureCancelledDeclinedBySigner,
      invitation: invitation,
      "from-database": sendFromDatabase,
      "transfer-parallels": transferParallels,
      "profiles-expiring-properties": profilesExpiringProperties,
      "background-check-monitoring-changes": backgroundCheckMonitoringChanges,
      "petition-approval-request-step-pending": petitionApprovalRequestStepPending,
      "petition-approval-request-step-finished": petitionApprovalRequestStepFinished,
      "petition-approval-request-step-canceled": petitionApprovalRequestStepCanceled,
    };
  }

  override async handler(payload: EmailSenderWorkerPayload) {
    const limiter = new RateLimitGuard(this.config.queueWorkers["email-sender"].rateLimit);

    const builder = this.builders[payload.type];
    const emails = await builder.build(payload.payload);

    for (const email of unMaybeArray(emails)) {
      if (!email) {
        continue;
      }

      if (
        process.env.NODE_ENV === "development" &&
        !this.config.development.whitelistedEmails.some((e) => {
          const [l, d] = e.split("@");
          const [local, domain] = email.to.split("@");
          return d === domain && (l === local || local.startsWith(l + "+"));
        })
      ) {
        this.logger.warn(
          `DEVELOPMENT: ${email.to} is not whitelisted in .development.env. Skipping...`,
        );
        continue;
      }
      const attachments = await this.emailLogs.getEmailAttachments(email.id);
      await limiter.waitUntilAllowed();
      try {
        const result = await this.smtp.sendEmail({
          from: email.from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          replyTo: email.reply_to ?? undefined,
          headers: {
            "X-SES-CONFIGURATION-SET":
              this.config.ses.configurationSet[email.track_opens ? "tracking" : "noTracking"],
          },
          attachments: await pMap(
            attachments,
            async (attachment) => ({
              filename: attachment.filename,
              contentType: attachment.content_type,
              content: await this.storage.temporaryFiles.downloadFile(attachment.path),
            }),
            { concurrency: 1 },
          ),
        });
        await this.emailLogs.updateWithResponse(
          email.id,
          {
            response: JSON.stringify(result),
            external_id: result.response.startsWith("250 Ok")
              ? result.response.replace(/^250 Ok /, "")
              : null,
          },
          this.config.instanceName,
        );
      } catch (error) {
        if ((error as any)?.rejectedErrors?.some?.((err: any) => err?.responseCode === 501)) {
          // invalid address errors (incorrect email syntax, invalid configurations, etc)
          // emails could not be delivered
          if (email.created_from.startsWith("PetitionMessage:")) {
            await this.emails.onPetitionMessageBounced(
              parseInt(email.created_from.replace("PetitionMessage:", "")),
              this.config.instanceName,
            );
          } else if (email.created_from.startsWith("PetitionReminder:")) {
            await this.emails.onPetitionReminderBounced(
              parseInt(email.created_from.replace("PetitionReminder:", "")),
              this.config.instanceName,
            );
          }

          await this.emailLogs.updateWithResponse(
            email.id,
            { response: fastSafeStringify(error) },
            this.config.instanceName,
          );
        } else {
          throw error;
        }
      }
    }
  }
}
