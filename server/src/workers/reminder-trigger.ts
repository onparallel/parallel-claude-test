import { createCronWorker } from "./helpers/createCronWorker";
import { chunk } from "remeda";
import { eachOf } from "async";
import { calculateNextReminder } from "../util/calculateNextReminder";

createCronWorker("reminder-trigger", async (context) => {
  const accesses = await context.petitions.getRemindableAccesses();
  for (const batch of chunk(accesses, 10)) {
    await eachOf(batch, async (access) => {
      const hasMore = access.reminders_left > 1;
      const reminders = await context.reminders.createReminders(
        accesses.map((access) => ({
          petition_access_id: access.id,
          status: "PROCESSING",
          type: "AUTOMATIC",
          created_by: `PetitionAccess:${access.id}`,
        }))
      );
      await context.aws.enqueueReminders(reminders.map((r) => r.id));
      await context.petitions.updatePetitionAccessNextReminder(
        access.id,
        hasMore
          ? calculateNextReminder(
              access.next_reminder_at!,
              access.reminders_config!
            )
          : null,
        Math.max(access.reminders_left - 1, 0)
      );
    });
  }
});
