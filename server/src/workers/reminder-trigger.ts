import { createCronWorker } from "./helpers/createCronWorker";
import { chunk } from "remeda";
import { eachOf } from "async";
import { calculateNextReminder } from "../util/reminderUtils";

createCronWorker("reminder-trigger", async (context) => {
  const accesses = await context.petitions.getRemindableAccesses();
  for (const batch of chunk(accesses, 10)) {
    await eachOf(batch, async (access) => {
      await context.petitions.updatePetitionAccessNextReminder(
        access.id,
        calculateNextReminder(new Date(), access.reminders_config!)
      );
      const reminders = await context.petitions.createReminders(
        access.petition_id,
        accesses.map((access) => ({
          petition_access_id: access.id,
          status: "PROCESSING",
          type: "AUTOMATIC",
          created_by: `PetitionAccess:${access.id}`,
        }))
      );
      await context.aws.enqueueReminders(reminders.map((r) => r.id));
    });
  }
});
