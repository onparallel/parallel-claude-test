import { ContainerModule } from "inversify";
import { ANALYTICS_EVENT_LISTENER, AnalyticsEventListener } from "./AnalyticsEventListener";
import {
  DOCUMENT_PROCESSING_LISTENER,
  DocumentProcessingListener,
} from "./DocumentProcessingListener";
import { PETITION_ACTIVITY_LISTENER, PetitionActivityListener } from "./PetitionActivityListener";
import {
  PETITION_EVENT_SUBSCRIPTIONS_LISTENER,
  PetitionEventSubscriptionsListener,
} from "./PetitionEventSubscriptionsListener";
import {
  PROFILE_EVENT_SUBSCRIPTIONS_LISTENER,
  ProfileEventSubscriptionsListener,
} from "./ProfileEventSubscriptionsListener";
import {
  USER_NOTIFICATIONS_LISTENER,
  UserNotificationsListener,
} from "./UserNotificationsListener";

export const eventListenersModule = new ContainerModule((options) => {
  options.bind(ANALYTICS_EVENT_LISTENER).to(AnalyticsEventListener);
  options.bind(PETITION_EVENT_SUBSCRIPTIONS_LISTENER).to(PetitionEventSubscriptionsListener);
  options.bind(PROFILE_EVENT_SUBSCRIPTIONS_LISTENER).to(ProfileEventSubscriptionsListener);
  options.bind(PETITION_ACTIVITY_LISTENER).to(PetitionActivityListener);
  options.bind(DOCUMENT_PROCESSING_LISTENER).to(DocumentProcessingListener);
  options.bind(USER_NOTIFICATIONS_LISTENER).to(UserNotificationsListener);
});
