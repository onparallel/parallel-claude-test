import { createQueueWorker } from "./helpers/createQueueWorker";
import { emailBuildersModule } from "./queues/email-builders/module";
import { EmailSenderQueue } from "./queues/EmailSenderQueue";

createQueueWorker("email-sender", EmailSenderQueue, {
  additionalModules: [emailBuildersModule],
});
