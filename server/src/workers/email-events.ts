import { createQueueWorker } from "./helpers/createQueueWorker";

type EmailEventsWorkerPayload = {
  Message: string;
};

const worker = createQueueWorker(
  "email-events",
  async (payload: EmailEventsWorkerPayload, context) => {
    const message = JSON.parse(payload.Message);
    if (!message?.mail?.messageId) {
      return;
    }
    const emailLogId = await context.emails.findInternalId(
      message.mail.messageId
    );
    if (!emailLogId) {
      return;
    }
    const event = ({
      Delivery: "delivery",
      Bounce: "bounce",
      Open: "open",
    } as any)[message.eventType];
    await context.emails.createEvent({
      email_log_id: emailLogId,
      event,
      payload: JSON.stringify(message[event]),
    });
  }
);

worker.start();
