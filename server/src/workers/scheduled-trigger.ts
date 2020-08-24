import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("scheduled-trigger", async (context) => {
  const messageIds = await context.petitions.processScheduledMessages();
  await context.emails.sendPetitionMessageEmail(messageIds);
});
