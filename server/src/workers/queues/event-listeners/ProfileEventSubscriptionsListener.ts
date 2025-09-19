import { inject, injectable } from "inversify";
import { DatabaseError } from "pg";
import { isNonNullish, isNullish } from "remeda";
import { ProfileEventType, ProfileEventTypeValues } from "../../../db/__types";

import { ProfileEvent } from "../../../db/events/ProfileEvent";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { SubscriptionRepository } from "../../../db/repositories/SubscriptionRepository";
import {
  EVENT_SUBSCRIPTION_SERVICE,
  IEventSubscriptionService,
} from "../../../services/EventSubscriptionService";
import { mapProfileEvent } from "../../../util/eventMapper";
import { isAtLeast } from "../../../util/profileTypeFieldPermission";
import { pFilter } from "../../../util/promises/pFilter";
import { EventListener } from "../EventProcessorQueue";

export const PROFILE_EVENT_SUBSCRIPTIONS_LISTENER = Symbol.for(
  "PROFILE_EVENT_SUBSCRIPTIONS_LISTENER",
);

@injectable()
export class ProfileEventSubscriptionsListener implements EventListener<ProfileEventType> {
  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(SubscriptionRepository) private subscriptions: SubscriptionRepository,
    @inject(EVENT_SUBSCRIPTION_SERVICE)
    public readonly eventSubscription: IEventSubscriptionService,
  ) {}

  public types = ProfileEventTypeValues;

  public async handle(event: ProfileEvent) {
    const profile = await this.profiles.loadProfile(event.profile_id);
    if (!profile) {
      return;
    }

    const userIds = (await this.profiles.loadProfileSubscribers(event.profile_id)).map(
      (p) => p.user_id!,
    );

    try {
      if (userIds.length > 0) {
        await this.profiles.attachProfileEventsToUsers({ profileEventId: event.id, userIds });
      }
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.constraint === "user_profile_event_log__user_id__profile_event_id"
      ) {
        // this event is already attached, continue normally
      } else {
        throw error;
      }
    }

    const activeSubscriptions = await this.subscriptions.loadProfileEventSubscriptionsByOrgId(
      profile.org_id,
    );

    const userSubscriptions = await pFilter(
      activeSubscriptions,
      async (s) => {
        if (!s.is_enabled) {
          return false;
        }
        if (s.event_types !== null && !s.event_types.includes(event.type)) {
          return false;
        }
        if (s.from_profile_type_id !== null && s.from_profile_type_id !== profile.profile_type_id) {
          return false;
        }
        if (s.ignore_owner_events && "user_id" in event.data && s.user_id === event.data.user_id) {
          return false;
        }
        if (isNonNullish(s.from_profile_type_field_ids) && "profile_type_field_id" in event.data) {
          const profileTypeField = await this.profiles.loadProfileTypeField(
            event.data.profile_type_field_id,
          );
          if (
            isNullish(profileTypeField) ||
            !s.from_profile_type_field_ids.includes(profileTypeField.id)
          ) {
            return false;
          }
        }
        if ("profile_type_field_id" in event.data) {
          const userPermission = await this.profiles.loadProfileTypeFieldUserEffectivePermission({
            userId: s.user_id,
            profileTypeFieldId: event.data.profile_type_field_id,
          });
          if (!isAtLeast(userPermission, "READ")) {
            return false;
          }
        }
        return true;
      },
      { concurrency: 5 },
    );

    if (userSubscriptions.length === 0) {
      return;
    }

    await this.eventSubscription.processSubscriptions(userSubscriptions, mapProfileEvent(event));
  }
}
