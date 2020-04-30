import { createCronWorker } from "./helpers/createCronWorker";
import { chunk } from "remeda";
import { eachOf } from "async";
import { calculateNextReminder } from "../util/calculateNextReminder";

createCronWorker("reminder-trigger", async (context) => {
  const sendouts = await context.petitions.processSendoutReminders();
  for (const batch of chunk(sendouts, 10)) {
    await eachOf(batch, async (sendout) => {
      const hasMore = sendout.reminders_left > 1;
      await context.petitions.updatePetitionSendout(sendout.id, {
        next_reminder_at: hasMore
          ? calculateNextReminder(
              sendout.next_reminder_at!,
              sendout.reminders_offset!,
              sendout.reminders_time!,
              sendout.reminders_timezone!,
              sendout.reminders_weekdays_only!
            )
          : null,
        reminders_left: sendout.reminders_left - 1,
      });
    });
    const reminders = await context.reminders.createReminders(
      sendouts.map((sendout) => ({
        petition_sendout_id: sendout.id,
        status: "PROCESSING",
        type: "AUTOMATIC",
        created_by: `PetitionSendout:${sendout.id}`,
      }))
    );
    await context.aws.enqueueReminders(reminders.map((r) => r.id));
  }
});
