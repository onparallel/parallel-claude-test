import { createQueueWorker } from "./helpers/createQueueWorker";

type EmailEventsWorkerPayload = {
  eventType: string;
  mail: any;
};

createQueueWorker(
  "email-events",
  async (payload: EmailEventsWorkerPayload, context) => {
    if (!payload?.mail?.messageId) {
      return;
    }
    const emailLogId = await context.emailLogs.findInternalId(
      payload.mail.messageId
    );
    if (!emailLogId) {
      return;
    }
    const event = (
      {
        Delivery: "delivery",
        Bounce: "bounce",
        Open: "open",
        Complaint: "complaint",
      } as any
    )[payload.eventType];
    await context.emailLogs.createEmailEvent({
      email_log_id: emailLogId,
      event,
      payload: JSON.stringify((payload as any)[event]),
    });

    const message = await context.petitions.loadMessageByEmailLogId(emailLogId);
    // only process the bounce if it came with a PetitionMessage (when sending a petition)
    if (event === "bounce" && message) {
      await context.emails.sendPetitionMessageBouncedEmail(message.id);
      await context.system.createEvent({
        type: "EMAIL_BOUNCED",
        data: { email_log_id: emailLogId },
      });
    }
  },
  {
    parser: (message) => {
      const m = JSON.parse(message);
      return JSON.parse(m.Message);
    },
  }
);
