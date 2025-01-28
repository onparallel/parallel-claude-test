import { DatabaseError } from "pg";
import { isNonNullish, isNullish } from "remeda";
import { ProfileEventTypeValues } from "../../db/__types";
import { mapProfileEvent } from "../../util/eventMapper";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { pFilter } from "../../util/promises/pFilter";
import { listener } from "../helpers/EventProcessor";

export const profileEventSubscriptionsListener = listener(
  ProfileEventTypeValues,
  async (event, ctx) => {
    const profile = await ctx.profiles.loadProfile(event.profile_id);
    if (!profile) {
      return;
    }

    const userIds = (await ctx.profiles.loadProfileSubscribers(event.profile_id)).map(
      (p) => p.user_id!,
    );

    try {
      if (userIds.length > 0) {
        await ctx.profiles.attachProfileEventsToUsers(event.id, userIds);
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

    const activeSubscriptions = await ctx.subscriptions.loadProfileEventSubscriptionsByOrgId(
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
        if (isNonNullish(s.from_profile_type_field_ids) && "profile_type_field_id" in event.data) {
          const profileTypeField = await ctx.profiles.loadProfileTypeField(
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
          const userPermission = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission({
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

    await ctx.eventSubscription.processSubscriptions(userSubscriptions, mapProfileEvent(event));
  },
);
