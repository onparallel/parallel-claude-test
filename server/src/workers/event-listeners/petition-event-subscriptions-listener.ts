import { DatabaseError } from "pg";
import { isDefined } from "remeda";
import { PetitionEventTypeValues } from "../../db/__types";
import { mapPetitionEvent } from "../../util/eventMapper";
import { pFilter } from "../../util/promises/pFilter";
import { listener } from "../helpers/EventProcessor";

export const petitionEventSubscriptionsListener = listener(
  PetitionEventTypeValues,
  async (event, ctx) => {
    const petition = await ctx.petitions.loadPetition(event.petition_id);
    if (!petition) {
      return;
    }

    const userIds = (await ctx.petitions.loadEffectivePermissions(petition.id)).map(
      (p) => p.user_id!,
    );

    if (userIds.length === 0) {
      return;
    }

    try {
      await ctx.petitions.attachPetitionEventsToUsers(event.id, userIds);
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.constraint === "user_petition_event_log__user_id__petition_event_id"
      ) {
        // this event is already attached, continue normally
      } else {
        throw error;
      }
    }

    const activeSubscriptions = (
      await ctx.subscriptions.loadPetitionEventSubscriptionsByUserId(userIds)
    ).flat();

    const userSubscriptions = await pFilter(
      activeSubscriptions,
      async (s) => {
        if (!s.is_enabled) {
          return false;
        }
        if (s.event_types !== null && !s.event_types.includes(event.type)) {
          return false;
        }
        if (s.from_template_id !== null && s.from_template_id !== petition.from_template_id) {
          return false;
        }
        if (isDefined(s.from_template_field_ids) && "petition_field_id" in event.data) {
          const field = await ctx.petitions.loadField(event.data.petition_field_id);
          if (
            isDefined(field) &&
            isDefined(field.from_petition_field_id) &&
            !s.from_template_field_ids.includes(field.from_petition_field_id)
          ) {
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

    await ctx.eventSubscription.processSubscriptions(userSubscriptions, mapPetitionEvent(event));
  },
);
