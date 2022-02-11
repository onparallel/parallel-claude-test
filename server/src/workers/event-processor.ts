import { WorkerContext } from "../context";
import { PetitionEvent, SystemEvent } from "../db/events";
import { PetitionEventType, SystemEventType } from "../db/__types";
import { analyticsEventListener } from "./event-listeners/analytics-event-listener";
import { eventSubscriptionsListener } from "./event-listeners/event-subscriptions-listener";
import { userNotificationsListener } from "./event-listeners/user-notifications-listener";
import { EventProcessor } from "./helpers/EventProcessor";
import { createQueueWorker } from "./helpers/createQueueWorker";

export type Event = PetitionEvent | SystemEvent;
export type EventType = PetitionEventType | SystemEventType;

export type EventListener<TEvent extends Event = Event> = (
  event: TEvent,
  ctx: WorkerContext
) => Promise<void>;

createQueueWorker(
  "event-processor",
  new EventProcessor()
    .register("*", eventSubscriptionsListener)
    .register(
      [
        "PETITION_CREATED",
        "PETITION_CLONED",
        "PETITION_CLOSED",
        "PETITION_COMPLETED",
        "PETITION_DELETED",
        "REMINDER_SENT",
        "TEMPLATE_USED",
        "ACCESS_OPENED",
        "USER_LOGGED_IN",
        "USER_CREATED",
        "ACCESS_ACTIVATED",
        "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
        "EMAIL_VERIFIED",
        "INVITE_SENT",
        "REMINDERS_OPT_OUT",
        "REPLY_CREATED",
        "COMMENT_PUBLISHED",
        "EMAIL_OPENED",
        "SIGNATURE_CANCELLED",
        "SIGNATURE_STARTED",
        "SIGNATURE_COMPLETED",
        "SIGNATURE_REMINDER",
        "ORGANIZATION_LIMIT_REACHED",
      ],
      analyticsEventListener
    )
    .register(
      [
        "PETITION_COMPLETED",
        "COMMENT_PUBLISHED",
        "PETITION_MESSAGE_BOUNCED",
        "PETITION_REMINDER_BOUNCED",
        "SIGNATURE_COMPLETED",
        "SIGNATURE_CANCELLED",
        "USER_PERMISSION_ADDED",
        "GROUP_PERMISSION_ADDED",
        "REMINDERS_OPT_OUT",
        "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
      ],
      userNotificationsListener
    )
    .listen()
);
