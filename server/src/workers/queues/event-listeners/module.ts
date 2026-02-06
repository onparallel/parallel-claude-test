import { ContainerModule } from "inversify";
import { ANALYTICS_EVENT_LISTENER, AnalyticsEventListener } from "./AnalyticsEventListener";
import {
  AUTOMATIC_BACKGROUND_CHECK_PETITION_LISTENER,
  AutomaticBackgroundCheckPetitionListener,
} from "./AutomaticBackgroundCheckPetitionListener";
import {
  AUTOMATIC_BACKGROUND_CHECK_PROFILE_LISTENER,
  AutomaticBackgroundCheckProfileListener,
} from "./AutomaticBackgroundCheckProfileListener";
import { CLIENT_RISK_UPDATE_LISTENER, ClientRiskUpdateListener } from "./ClientRiskUpdateListener";
import {
  DOCUMENT_PROCESSING_LISTENER,
  DocumentProcessingListener,
} from "./DocumentProcessingListener";
import { PETITION_ACTIVITY_LISTENER, PetitionActivityListener } from "./PetitionActivityListener";
import {
  PETITION_APPROVAL_PROCESS_LISTENER,
  PetitionApprovalProcessListener,
} from "./PetitionApprovalProcessListener";
import {
  PETITION_EVENT_SUBSCRIPTIONS_LISTENER,
  PetitionEventSubscriptionsListener,
} from "./PetitionEventSubscriptionsListener";
import {
  PROFILE_DATE_REFRESH_BY_RISK_LISTENER,
  ProfileDateRefreshByRiskListener,
} from "./ProfileDateRefreshByRiskListener";
import {
  PROFILE_EVENT_SUBSCRIPTIONS_LISTENER,
  ProfileEventSubscriptionsListener,
} from "./ProfileEventSubscriptionsListener";
import { PROFILE_SYNC_LISTENER, ProfileSyncListener } from "./ProfileSyncListener";
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
  options
    .bind(AUTOMATIC_BACKGROUND_CHECK_PETITION_LISTENER)
    .to(AutomaticBackgroundCheckPetitionListener);
  options
    .bind(AUTOMATIC_BACKGROUND_CHECK_PROFILE_LISTENER)
    .to(AutomaticBackgroundCheckProfileListener);
  options.bind(PETITION_APPROVAL_PROCESS_LISTENER).to(PetitionApprovalProcessListener);
  options.bind(CLIENT_RISK_UPDATE_LISTENER).to(ClientRiskUpdateListener);
  options.bind(PROFILE_DATE_REFRESH_BY_RISK_LISTENER).to(ProfileDateRefreshByRiskListener);
  options.bind(PROFILE_SYNC_LISTENER).to(ProfileSyncListener);
});
