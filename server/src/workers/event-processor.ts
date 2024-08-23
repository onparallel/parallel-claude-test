import { analyticsEventListener } from "./event-listeners/analytics-event-listener";
import { documentProcessingListener } from "./event-listeners/document-processing-listener";
import { petitionActivityListener } from "./event-listeners/petition-activity-listener";
import { petitionEventSubscriptionsListener } from "./event-listeners/petition-event-subscriptions-listener";
import { profileEventSubscriptionsListener } from "./event-listeners/profile-event-subscriptions-listener";
import { userNotificationsListener } from "./event-listeners/user-notifications-listener";
import { EventProcessor } from "./helpers/EventProcessor";
import { createQueueWorker } from "./helpers/createQueueWorker";

createQueueWorker(
  "event-processor",
  new EventProcessor()
    .register(userNotificationsListener)
    .register(petitionEventSubscriptionsListener)
    .register(profileEventSubscriptionsListener)
    .register(analyticsEventListener)
    .register(petitionActivityListener)
    .register(documentProcessingListener)
    .listen(),
  { batchSize: 10 },
);
