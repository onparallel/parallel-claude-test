import { unMaybeArray } from "../util/arrays";
import { EmailSenderWorkerPayload, build } from "./emails/builder";
import { createQueueWorker } from "./helpers/createQueueWorker";

createQueueWorker<EmailSenderWorkerPayload>(
  "email-sender",
  async (payload, context) => {
    const emails = await build(payload, context);
    for (const email of unMaybeArray(emails)) {
      if (email) {
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
