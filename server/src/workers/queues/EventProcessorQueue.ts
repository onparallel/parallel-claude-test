import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { Config, CONFIG } from "../../config";
import { PetitionEventType, ProfileEventType, SystemEventType } from "../../db/__types";
import { PetitionEvent } from "../../db/events/PetitionEvent";
import { ProfileEvent } from "../../db/events/ProfileEvent";
import { SystemEvent } from "../../db/events/SystemEvent";
import { EventRepository } from "../../db/repositories/EventRepository";
import { ILogger, LOGGER } from "../../services/Logger";
import { Prettify } from "../../util/types";
import { QueueWorker } from "../helpers/createQueueWorker";

import {
  ANALYTICS_EVENT_LISTENER,
  AnalyticsEventListener,
} from "./event-listeners/AnalyticsEventListener";
import {
  AUTOMATIC_BACKGROUND_CHECK_PETITION_LISTENER,
  AutomaticBackgroundCheckPetitionListener,
} from "./event-listeners/AutomaticBackgroundCheckPetitionListener";
import {
  AUTOMATIC_BACKGROUND_CHECK_PROFILE_LISTENER,
  AutomaticBackgroundCheckProfileListener,
} from "./event-listeners/AutomaticBackgroundCheckProfileListener";
import {
  CLIENT_RISK_UPDATE_LISTENER,
  ClientRiskUpdateListener,
} from "./event-listeners/ClientRiskUpdateListener";
import {
  DOCUMENT_PROCESSING_LISTENER,
  DocumentProcessingListener,
} from "./event-listeners/DocumentProcessingListener";
import {
  PETITION_ACTIVITY_LISTENER,
  PetitionActivityListener,
} from "./event-listeners/PetitionActivityListener";
import {
  PETITION_APPROVAL_PROCESS_LISTENER,
  PetitionApprovalProcessListener,
} from "./event-listeners/PetitionApprovalProcessListener";
import {
  PETITION_EVENT_SUBSCRIPTIONS_LISTENER,
  PetitionEventSubscriptionsListener,
} from "./event-listeners/PetitionEventSubscriptionsListener";
import {
  PROFILE_EVENT_SUBSCRIPTIONS_LISTENER,
  ProfileEventSubscriptionsListener,
} from "./event-listeners/ProfileEventSubscriptionsListener";
import {
  USER_NOTIFICATIONS_LISTENER,
  UserNotificationsListener,
} from "./event-listeners/UserNotificationsListener";

export type EventType = PetitionEventType | SystemEventType | ProfileEventType;

export interface EventProcessorPayload {
  id: number;
  type: EventType;
  created_at: Date; // this helps with content-based deduplication and is used to check if the event should be processed or not
  table_name: "petition_event" | "system_event" | "profile_event";
}
type EventListenerHandle<T extends EventType> = (
  payload: Prettify<
    T extends PetitionEventType
      ? PetitionEvent & { type: T }
      : T extends SystemEventType
        ? SystemEvent & { type: T }
        : ProfileEvent & { type: T }
  >,
) => Promise<void>;

export interface EventListener<T extends EventType> {
  readonly types: T[];
  handle: EventListenerHandle<T>;
}

@injectable()
export class EventProcessor extends QueueWorker<EventProcessorPayload> {
  private listeners = new Map<EventType, EventListener<any>[]>();

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(EventRepository) private events: EventRepository,
    @inject(LOGGER) private logger: ILogger,
    @inject(PETITION_EVENT_SUBSCRIPTIONS_LISTENER)
    petitionEventSubscriptionsListener: PetitionEventSubscriptionsListener,
    @inject(PROFILE_EVENT_SUBSCRIPTIONS_LISTENER)
    profileEventSubscriptionsListener: ProfileEventSubscriptionsListener,
    @inject(ANALYTICS_EVENT_LISTENER)
    analyticsEventListener: AnalyticsEventListener,
    @inject(PETITION_ACTIVITY_LISTENER)
    petitionActivityListener: PetitionActivityListener,
    @inject(DOCUMENT_PROCESSING_LISTENER)
    documentProcessingListener: DocumentProcessingListener,
    @inject(USER_NOTIFICATIONS_LISTENER)
    userNotificationsListener: UserNotificationsListener,
    @inject(AUTOMATIC_BACKGROUND_CHECK_PETITION_LISTENER)
    automaticBackgroundCheckPetitionListener: AutomaticBackgroundCheckPetitionListener,
    @inject(AUTOMATIC_BACKGROUND_CHECK_PROFILE_LISTENER)
    automaticBackgroundCheckProfileListener: AutomaticBackgroundCheckProfileListener,
    @inject(PETITION_APPROVAL_PROCESS_LISTENER)
    petitionApprovalProcessListener: PetitionApprovalProcessListener,
    @inject(CLIENT_RISK_UPDATE_LISTENER)
    clientRiskUpdateListener: ClientRiskUpdateListener,
  ) {
    super();

    this.register(analyticsEventListener)
      .register(petitionEventSubscriptionsListener)
      .register(profileEventSubscriptionsListener)
      .register(clientRiskUpdateListener)
      .register(petitionActivityListener)
      .register(documentProcessingListener)
      .register(userNotificationsListener)
      .register(automaticBackgroundCheckPetitionListener)
      .register(automaticBackgroundCheckProfileListener)
      // approvals listener should always run last, as the approval process can have activation conditions that depend on replies created by other listeners
      .register(petitionApprovalProcessListener);
  }

  override async handler(payload: EventProcessorPayload): Promise<void> {
    if (this.listeners.has(payload.type)) {
      const event = await this.events.pickEventToProcess({
        id: payload.id,
        tableName: payload.table_name,
        createdAt: payload.created_at,
        pickedBy: this.config.instanceName,
      });

      if (isNonNullish(event)) {
        for (const listener of this.listeners.get(event.type)!) {
          try {
            await listener.handle(event);
          } catch (error) {
            // log error and continue to other listeners
            if (error instanceof Error) {
              this.logger.error(error.message, { stack: error.stack });
            } else {
              this.logger.error(error);
            }
          }
        }

        await this.events.markEventAsProcessed(event.id, payload.table_name);
      }
    }
  }

  private register<T extends EventType>(listener: EventListener<T>) {
    for (const type of listener.types) {
      if (this.listeners.has(type)) {
        this.listeners.get(type)!.push(listener);
      } else {
        this.listeners.set(type, [listener]);
      }
    }
    return this;
  }
}
