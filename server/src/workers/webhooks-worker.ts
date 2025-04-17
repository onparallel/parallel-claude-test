import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { createQueueWorker } from "./helpers/createQueueWorker";
import { WebhooksWorker } from "./queues/WebhooksWorkerQueue";

createQueueWorker("webhooks-worker", WebhooksWorker, {
  pollingBatchSize: 10,
  processBatchConcurrently: true,
  processBatchWithConcurrency: 5,
});
