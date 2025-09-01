import { createQueueWorker } from "./helpers/createQueueWorker";
import { EmailEventsQueue } from "./queues/EmailEventsQueue";

createQueueWorker("email-events", EmailEventsQueue, {
  parser: (message) => {
    const m = JSON.parse(message);
    return JSON.parse(m.Message);
  },
});
