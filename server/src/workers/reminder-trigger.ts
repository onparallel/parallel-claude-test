import pMap from "p-map";
import { groupBy } from "remeda";
import { calculateNextReminder } from "../util/reminderUtils";
import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("reminder-trigger", async (context) => {
  const accesses = await context.petitions.getRemindableAccesses();
  for (const [, batch] of Object.entries(
    groupBy(accesses, (a) => a.petition_id)
  )) {
    // Update next reminders
    await pMap(
      batch,
      async (access) => {
        await context.petitions.updatePetitionAccessNextReminder(
          access.id,
          calculateNextReminder(new Date(), access.reminders_config!)
        );
      },
      { concurrency: 5 }
    );
    const reminders = await context.petitions.createReminders(
      batch[0].petition_id,
      batch.map((access) => ({
        petition_access_id: access.id,
        status: "PROCESSING",
        type: "AUTOMATIC",
        created_by: `PetitionAccess:${access.id}`,
      }))
    );
    await context.emails.sendPetitionReminderEmail(reminders.map((r) => r.id));
    await context.petitions.createEvent(
      reminders.map((reminder) => ({
        type: "REMINDER_SENT",
        petition_id: batch[0].petition_id,
        data: {
          petition_reminder_id: reminder.id,
        },
      }))
    );
  }
});
