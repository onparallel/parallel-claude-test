import { PetitionEvent, SystemEvent, SystemEventType } from "../db/events";
import { PetitionEventType } from "../db/__types";
import { analyticsEventListener } from "./event-listeners/analytics-event-listener";
import { eventSubscriptionsListener } from "./event-listeners/event-subscriptions-listener";
import { createQueueWorker } from "./helpers/createQueueWorker";

export type ServerEvent = PetitionEvent | SystemEvent;
export type EventType = PetitionEventType | SystemEventType;

createQueueWorker("event-processor", async (event: ServerEvent, ctx) => {
  await analyticsEventListener(
    event,
    [
      "PETITION_CREATED",
      "PETITION_CLONED",
      "PETITION_CLOSED",
      "PETITION_SENT",
      "PETITION_COMPLETED",
      "PETITION_DELETED",
      "REMINDER_SENT",
      "TEMPLATE_USED",
      "ACCESS_OPENED",
      "USER_LOGGED_IN",
      "USER_CREATED",
    ],
    ctx
    // catch and log but avoid crashing so other listeners can process the event
  ).catch((e) => ctx.logger.error(e.stack));

  await eventSubscriptionsListener(
    event,
    [
      "ACCESS_ACTIVATED",
      "ACCESS_DEACTIVATED",
      "ACCESS_DELEGATED",
      "ACCESS_OPENED",
      "COMMENT_DELETED",
      "COMMENT_PUBLISHED",
      "GROUP_PERMISSION_ADDED",
      "GROUP_PERMISSION_EDITED",
      "GROUP_PERMISSION_REMOVED",
      "MESSAGE_CANCELLED",
      "MESSAGE_SCHEDULED",
      "MESSAGE_SENT",
      "OWNERSHIP_TRANSFERRED",
      "PETITION_CLOSED",
      "PETITION_CLOSED_NOTIFIED",
      "PETITION_COMPLETED",
      "PETITION_CREATED",
      "PETITION_REOPENED",
      "REMINDER_SENT",
      "REPLY_CREATED",
      "REPLY_DELETED",
      "REPLY_UPDATED",
      "SIGNATURE_CANCELLED",
      "SIGNATURE_COMPLETED",
      "SIGNATURE_STARTED",
      "USER_PERMISSION_ADDED",
      "USER_PERMISSION_EDITED",
      "USER_PERMISSION_REMOVED",
    ],
    ctx
    // catch and log but avoid crashing so other listeners can process the event
  ).catch((e) => ctx.logger.error(e.stack));
});
