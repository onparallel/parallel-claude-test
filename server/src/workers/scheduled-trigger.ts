import { createCronWorker } from "./helpers/createCronWorker";

const worker = createCronWorker("scheduled-trigger", async (context) => {
  const sendouts = await context.petitions.processScheduledSendouts();
  await context.aws.enqueueSendouts(sendouts);
});

worker.start();
