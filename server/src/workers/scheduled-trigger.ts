import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("scheduled-trigger", async (context) => {
  const messages = await context.petitions.processScheduledMessages();
  await Promise.all([
    context.emails.sendPetitionMessageEmail(messages.map((m) => m.id)),
    context.petitions.createEvent(
      messages.map((message) => ({
        type: "MESSAGE_SENT",
        data: { petition_message_id: message.id },
        petition_id: message.petition_id,
      }))
    ),
  ]);
});
