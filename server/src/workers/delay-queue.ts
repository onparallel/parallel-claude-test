import { createQueueWorker } from "./helpers/createQueueWorker";
import { DelayQueue } from "./queues/DelayQueue";

createQueueWorker("delay-queue", DelayQueue, {
  pollingBatchSize: 10,
  processBatchConcurrently: true,
  processBatchWithConcurrency: 10,
});
