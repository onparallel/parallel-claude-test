import { createQueueWorker } from "./helpers/createQueueWorker";
import { eventListenersModule } from "./queues/event-listeners/module";
import { EventProcessor } from "./queues/EventProcessorQueue";

createQueueWorker("event-processor", EventProcessor, {
  additionalModules: [eventListenersModule],
  pollingBatchSize: 10,
  processBatchConcurrently: true,
  processBatchWithConcurrency: 10,
});
