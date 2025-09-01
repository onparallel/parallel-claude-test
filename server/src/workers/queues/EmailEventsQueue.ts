import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../config";
import { EmailLogRepository } from "../../db/repositories/EmailLogRepository";
import { PetitionRepository } from "../../db/repositories/PetitionRepository";
import { SystemRepository } from "../../db/repositories/SystemRepository";
import { EMAILS, IEmailsService } from "../../services/EmailsService";
import { QueueWorker } from "../helpers/createQueueWorker";

export interface EmailEventsWorkerPayload {
  eventType: string;
  mail: any;
}

@injectable()
export class EmailEventsQueue extends QueueWorker<EmailEventsWorkerPayload> {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(SystemRepository) private system: SystemRepository,
    @inject(EMAILS) private emails: IEmailsService,
  ) {
    super();
  }

  override async handler(payload: EmailEventsWorkerPayload) {
    if (!payload.mail?.messageId) {
      return;
    }
    const emailLogId = await this.emailLogs.findInternalId(payload.mail.messageId);
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
    await this.emailLogs.createEmailEvent({
      email_log_id: emailLogId,
      event,
      payload: JSON.stringify(eventPayload),
    });

    const [message, reminder] = await Promise.all([
      this.petitions.loadMessageByEmailLogId(emailLogId),
      this.petitions.loadReminderByEmailLogId(emailLogId),
    ]);

    if (event === "bounce") {
      if (eventPayload.bounceType === "Transient" && eventPayload.bounceSubType === "General") {
        return;
      }

      // bounce can come from a PetitionMessage or a PetitionReminder
      if (message) {
        await this.emails.onPetitionMessageBounced(message.id, this.config.instanceName);
      } else if (reminder) {
        await this.emails.onPetitionReminderBounced(reminder.id, this.config.instanceName);
      }
    } else if (event === "complaint") {
      if (message || reminder) {
        const access = await this.petitions.loadAccess(
          message?.petition_access_id ?? reminder!.petition_access_id,
        );
        if (access && !access.reminders_opt_out) {
          await this.petitions.optOutReminders([access.id]);
          await this.petitions.createEvent({
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
          (await this.petitions.loadAccess(reminder!.petition_access_id))?.petition_id)!;
        await this.system.createEvent({
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
        await this.petitions.markPetitionAccessEmailBounceStatus(
          message?.petition_access_id ?? reminder!.petition_access_id,
          false,
          this.config.instanceName,
        );
      }
    }
  }
}
