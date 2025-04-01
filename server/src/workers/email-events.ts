import { createQueueWorker_OLD } from "./helpers/createQueueWorker_OLD";

export interface EmailEventsWorkerPayload {
  eventType: string;
  mail: any;
}

createQueueWorker_OLD(
  "email-events",
  async (payload, context) => {
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
      if (eventPayload.bounceType === "Transient" && eventPayload.bounceSubType === "General") {
        return;
      }

      // bounce can come from a PetitionMessage or a PetitionReminder
      if (message) {
        await context.emails.onPetitionMessageBounced(message.id, context.config.instanceName);
      } else if (reminder) {
        await context.emails.onPetitionReminderBounced(reminder.id, context.config.instanceName);
      }
    } else if (event === "complaint") {
      if (message || reminder) {
        const access = await context.petitions.loadAccess(
          message?.petition_access_id ?? reminder!.petition_access_id,
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
          false,
          context.config.instanceName,
        );
      }
    }
  },
  {
    parser: (message) => {
      const m = JSON.parse(message);
      return JSON.parse(m.Message);
    },
  },
);
