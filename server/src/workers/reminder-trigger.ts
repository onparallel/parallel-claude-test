import { createCronWorker } from "./helpers/createCronWorker";
import { groupBy } from "remeda";
import { eachLimit } from "async";
import { calculateNextReminder } from "../util/reminderUtils";

createCronWorker("reminder-trigger", async (context) => {
  const accesses = await context.petitions.getRemindableAccesses();
  for (const [, batch] of Object.entries(
    groupBy(accesses, (a) => a.petition_id)
  )) {
    // Update next reminders
    await eachLimit(batch, 5, async (access) => {
      await context.petitions.updatePetitionAccessNextReminder(
        access.id,
        calculateNextReminder(new Date(), access.reminders_config!)
      );
    });
    const reminders = await context.petitions.createReminders(
      batch[0].petition_id,
      batch.map((access) => ({
        petition_access_id: access.id,
        status: "PROCESSING",
        type: "AUTOMATIC",
        created_by: `PetitionAccess:${access.id}`,
      }))
    );
    await context.aws.enqueueReminders(reminders.map((r) => r.id));
  }
});
