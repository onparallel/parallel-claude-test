import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("old-notifications", async (ctx) => {
  // mark as read every unread user notifications that was created more than 1 months ago
  await ctx.petitions.markOldPetitionUserNotificationsAsRead(1);

  // delete notifications that were created more than 6 months ago
  await ctx.petitions.deleteOldPetitionUserNotifications(6);
});
