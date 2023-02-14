import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("old-notifications", async (ctx) => {
  const MAX_MONTHS = 2;
  // mark as read every unread user notifications that was created more than MAX_MONTHS months ago
  await ctx.petitions.markOldPetitionUserNotificationsAsRead(MAX_MONTHS);
});
