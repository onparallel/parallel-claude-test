import { inject, injectable } from "inversify";
import pMap from "p-map";
import { groupBy } from "remeda";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { EMAILS, IEmailsService } from "../services/EmailsService";
import { calculateNextReminder } from "../util/reminderUtils";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";

@injectable()
export class ReminderTriggerCronWorker extends CronWorker<"reminder-trigger"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(EMAILS) private emails: IEmailsService,
  ) {
    super();
  }

  async handler() {
    const accesses = await this.petitions.getAutomaticRemindableAccesses();
    for (const [, batch] of Object.entries(groupBy(accesses, (a) => a.petition_id))) {
      // Update next reminders
      const remindableAccesses = (
        await pMap(
          batch,
          async (access) => {
            const petition = await this.petitions.loadPetition(access.petition_id);
            return await this.petitions.updatePetitionAccessNextReminder(
              access.id,
              petition?.status === "PENDING"
                ? calculateNextReminder(new Date(), access.reminders_config!)
                : null,
            );
          },
          { concurrency: 5 },
        )
      ).filter((access) => access.next_reminder_at !== null);
      const reminders = await this.petitions.createReminders(
        "AUTOMATIC",
        remindableAccesses.map((access) => ({
          petition_access_id: access.id,
          created_by: `PetitionAccess:${access.id}`,
        })),
      );
      if (reminders.length > 0) {
        await this.emails.sendPetitionReminderEmail(reminders.map((r) => r.id));
        await this.petitions.createEvent(
          reminders.map((reminder) => ({
            type: "REMINDER_SENT",
            petition_id: remindableAccesses[0].petition_id,
            data: {
              petition_reminder_id: reminder.id,
            },
          })),
        );
      }
    }
  }
}

createCronWorker("reminder-trigger", ReminderTriggerCronWorker);
