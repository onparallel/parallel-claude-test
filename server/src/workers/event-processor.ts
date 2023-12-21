import { PetitionEventType, SystemEventType } from "../db/__types";
import { analyticsEventListener } from "./event-listeners/analytics-event-listener";
import { eventSubscriptionsListener } from "./event-listeners/event-subscriptions-listener";
import { petitionActivityListener } from "./event-listeners/petition-activity-listener";
import { userNotificationsListener } from "./event-listeners/user-notifications-listener";
import { EventProcessor } from "./helpers/EventProcessor";
import { createQueueWorker } from "./helpers/createQueueWorker";

export type EventType = PetitionEventType | SystemEventType;

export interface EventProcessorPayload {
  id: number;
  type: EventType;
  created_at: Date; // this helps with content-based deduplication and is used to check if the event should be processed or not
  table_name: "petition_event" | "system_event";
}

createQueueWorker(
  "event-processor",
  new EventProcessor()
    .register(userNotificationsListener)
    .register(eventSubscriptionsListener)
    .register(analyticsEventListener)
    .register(petitionActivityListener)
    .listen(),
  { batchSize: 10 },
);
