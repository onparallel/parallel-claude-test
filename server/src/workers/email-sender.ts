import { createQueueWorker } from "./helpers/createQueueWorker";

type EmailSenderWorkerPayload = { email_log_id: number };

const worker = createQueueWorker(
  "email-sender",
  async ({ email_log_id }: EmailSenderWorkerPayload, context) => {
    const email = await context.emails.loadEmailLog(email_log_id);
    if (email) {
      const result = await context.smtp.sendEmail({
        from: email.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
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
);

worker.start();
