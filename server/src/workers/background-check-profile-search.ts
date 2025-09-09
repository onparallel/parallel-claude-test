import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { createQueueWorker } from "./helpers/createQueueWorker";
import { BackgroundCheckProfileSearchQueue } from "./queues/BackgroundCheckProfileSearchQueue";

createQueueWorker("background-check-profile-search", BackgroundCheckProfileSearchQueue, {
  pollingBatchSize: 10,
  processBatchConcurrently: true,
  processBatchWithConcurrency: 5,
});
