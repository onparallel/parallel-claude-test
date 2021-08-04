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

    if (event === "bounce") {
      // bounce can come from a PetitionMessage or a PetitionReminder
      const [message, reminder] = await Promise.all([
        context.petitions.loadMessageByEmailLogId(emailLogId),
        context.petitions.loadReminderByEmailLogId(emailLogId),
      ]);

      if (message) {
        await Promise.all([
          context.emails.sendPetitionMessageBouncedEmail(message.id),
          context.petitions.updateRemindersForPetition(
            message.petition_id,
            null
          ),
          context.system.createEvent({
            type: "PETITION_MESSAGE_BOUNCED",
            data: { petition_message_id: message.id },
          }),
        ]);
      } else if (reminder) {
        const access = (await context.petitions.loadAccess(
          reminder.petition_access_id
        ))!;

        await Promise.all([
          context.petitions.updateRemindersForPetition(
            access.petition_id,
            null
          ),
          context.system.createEvent({
            type: "PETITION_REMINDER_BOUNCED",
            data: {
              petition_reminder_id: reminder.id,
              petition_id: access.petition_id,
            },
          }),
        ]);
      }
    }
  },
  {
    parser: (message) => {
      const m = JSON.parse(message);
      return JSON.parse(m.Message);
    },
  }
);
