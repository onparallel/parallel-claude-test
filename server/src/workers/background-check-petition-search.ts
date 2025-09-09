import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { createQueueWorker } from "./helpers/createQueueWorker";
import { BackgroundCheckPetitionSearchQueue } from "./queues/BackgroundCheckPetitionSearchQueue";

createQueueWorker("background-check-petition-search", BackgroundCheckPetitionSearchQueue, {
  pollingBatchSize: 10,
  processBatchConcurrently: true,
  processBatchWithConcurrency: 5,
});
