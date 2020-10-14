import { createCronWorker } from "./helpers/createCronWorker";
import { groupBy } from "remeda";
import { eachLimit } from "async";
import { calculateNextReminder } from "../util/reminderUtils";
import { toGlobalId } from "../util/globalId";

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
    await context.emails.sendPetitionReminderEmail(reminders.map((r) => r.id));

    batch.forEach((access) => {
      context.analytics.trackEvent(
        "REMINDER_EMAIL_SENT",
        {
          petition_id: access.petition_id,
          user_id: access.granter_id,
          access_id: access.id,
          sent_count: 10 - access.reminders_left + 1,
          type: "AUTOMATIC",
        },
        toGlobalId("User", access.granter_id)
      );
    });
  }
});
