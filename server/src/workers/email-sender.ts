import { createQueueWorker } from "./helpers/createQueueWorker";
import { EmailSenderWorkerPayload, EmailType } from "./emails/types";
import { build } from "./emails/builder";
import { unMaybeArray } from "../util/arrays";

createQueueWorker<EmailSenderWorkerPayload<EmailType>>(
  "email-sender",
  async ({ type, payload }, context) => {
    const builtEmails = await build({ type, payload }, context);
    const emails = unMaybeArray(builtEmails);
    for (const email of emails) {
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
        await context.emails.updateWithResponse(email.id, {
          response: JSON.stringify(result),
          external_id: result.response.startsWith("250 Ok")
            ? result.response.replace(/^250 Ok /, "")
            : null,
        });
      }
    }
  }
);
