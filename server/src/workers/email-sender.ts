import { unMaybeArray } from "../util/arrays";
import { commentsContactNotification } from "./emails/comments-contact-notification";
import { commentsUserNotification } from "./emails/comments-user-notification";
import { petitionCompleted } from "./emails/petition-completed";
import { petitionMessage } from "./emails/petition-message";
import { petitionReminder } from "./emails/petition-reminder";
import { petitionClosedNotification } from "./emails/petition-closed-notification";
import { petitionSharingNotification } from "./emails/petition-sharing-notification";
import { petitionMessageBounced } from "./emails/petition-message-bounced";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { contactAuthenticationRequest } from "./emails/contact-authentication-request";
import { petitionAccessDelegated } from "./emails/petition-access-delegated";

const builders = {
  "petition-completed": petitionCompleted,
  "comments-user-notification": commentsUserNotification,
  "comments-contact-notification": commentsContactNotification,
  "petition-message": petitionMessage,
  "petition-reminder": petitionReminder,
  "petition-sharing-notification": petitionSharingNotification,
  "petition-closed-notification": petitionClosedNotification,
  "petition-message-bounced": petitionMessageBounced,
  "contact-authentication-request": contactAuthenticationRequest,
  "petition-access-delegated": petitionAccessDelegated,
};

export type EmailType = keyof typeof builders;

export type EmailPayload = {
  [K in EmailType]: Parameters<typeof builders[K]>[0];
};

type EmailSenderWorkerPayload = {
  [K in EmailType]: {
    type: K;
    payload: EmailPayload[K];
  };
}[EmailType];

createQueueWorker(
  "email-sender",
  async (payload: EmailSenderWorkerPayload, context) => {
    const builder = builders[payload.type];
    const emails = await builder(payload.payload as any, context);
    for (const email of unMaybeArray(emails)) {
      if (email) {
        const attachments = await context.emailLogs.getEmailAttachments(
          email.id
        );
        const result = await context.smtp.sendEmail({
          from: email.from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          replyTo: email.reply_to ?? undefined,
          headers: {
            "X-SES-CONFIGURATION-SET":
              context.config.ses.configurationSet[
                email.track_opens ? "tracking" : "noTracking"
              ],
          },
          attachments: attachments.map((attachment) => ({
            filename: attachment.filename,
            contentType: attachment.content_type,
            content: context.aws.temporaryFiles.downloadFile(attachment.path),
          })),
        });
        await context.emailLogs.updateWithResponse(email.id, {
          response: JSON.stringify(result),
          external_id: result.response.startsWith("250 Ok")
            ? result.response.replace(/^250 Ok /, "")
            : null,
        });
      }
    }
  }
);
