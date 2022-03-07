import pMap from "p-map";
import { groupBy } from "remeda";
import { calculateNextReminder } from "../util/reminderUtils";
import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("reminder-trigger", async (context) => {
  const accesses = await context.petitions.getRemindableAccesses();
  for (const [, batch] of Object.entries(groupBy(accesses, (a) => a.petition_id))) {
    // Update next reminders
    const remindableAccesses = (
      await pMap(
        batch,
        async (access) => {
          const petition = await context.petitions.loadPetition(access.petition_id);
          return await context.petitions.updatePetitionAccessNextReminder(
            access.id,
            petition?.status === "PENDING"
              ? calculateNextReminder(new Date(), access.reminders_config!)
              : null
          );
        },
        { concurrency: 5 }
      )
    ).filter((access) => access.next_reminder_at !== null);
    const reminders = await context.petitions.createReminders(
      remindableAccesses.map((access) => ({
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
        petition_id: remindableAccesses[0].petition_id,
        data: {
          petition_reminder_id: reminder.id,
        },
      }))
    );
  }
});
