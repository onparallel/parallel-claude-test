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
    const emailLogId = await context.emailLogs.findInternalId(payload.mail.messageId);
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

    const eventPayload = (payload as any)[event];
    await context.emailLogs.createEmailEvent({
      email_log_id: emailLogId,
      event,
      payload: JSON.stringify(eventPayload),
    });

    const [message, reminder] = await Promise.all([
      context.petitions.loadMessageByEmailLogId(emailLogId),
      context.petitions.loadReminderByEmailLogId(emailLogId),
    ]);

    if (event === "bounce") {
      // bounce can come from a PetitionMessage or a PetitionReminder
      if (message) {
        await Promise.all([
          context.petitions.markPetitionAccessEmailBounceStatus(message.petition_access_id, true),
          context.emails.sendPetitionMessageBouncedEmail(message.id),
          context.petitions.updateRemindersForPetition(message.petition_id, null),
          context.system.createEvent({
            type: "PETITION_MESSAGE_BOUNCED",
            data: { petition_message_id: message.id },
          }),
        ]);
      } else if (reminder) {
        const access = (await context.petitions.loadAccess(reminder.petition_access_id))!;

        await Promise.all([
          context.petitions.markPetitionAccessEmailBounceStatus(reminder.petition_access_id, true),
          context.petitions.updateRemindersForPetition(access.petition_id, null),
          context.system.createEvent({
            type: "PETITION_REMINDER_BOUNCED",
            data: {
              petition_reminder_id: reminder.id,
              petition_id: access.petition_id,
            },
          }),
        ]);
      }
    } else if (event === "complaint") {
      if (message || reminder) {
        const access = await context.petitions.loadAccess(
          message?.petition_access_id ?? reminder!.petition_access_id
        );
        if (access && !access.reminders_opt_out) {
          await context.petitions.optOutReminders([access.id]);
          await context.petitions.createEvent({
            type: "REMINDERS_OPT_OUT",
            petition_id: access.petition_id,
            data: {
              petition_access_id: access!.id,
              reason: "SPAM",
            },
          });
        }
      }
    } else if (event === "open") {
      if (message || reminder) {
        const petitionId = (message?.petition_id ??
          (await context.petitions.loadAccess(reminder!.petition_access_id))?.petition_id)!;
        await context.system.createEvent({
          type: "EMAIL_OPENED",
          data: {
            type: message ? "petition-message" : "petition-reminder",
            petition_id: petitionId,
            petition_message_id: message?.id,
            petition_reminder_id: reminder?.id,
            user_agent: eventPayload["userAgent"],
          },
        });
      }
    } else if (event === "delivery") {
      // on email delivery, make sure to update the email contact bounced status to false so next sends don't show "bounced" alerts
      if (message || reminder) {
        await context.petitions.markPetitionAccessEmailBounceStatus(
          message?.petition_access_id ?? reminder!.petition_access_id,
          false
        );
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
