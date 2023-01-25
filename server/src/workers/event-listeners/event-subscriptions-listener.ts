import fetch from "node-fetch";
import { PetitionEvent } from "../../db/events";
import { mapEvent } from "../../util/eventMapper";
import { EventListener } from "../event-processor";

export const eventSubscriptionsListener: EventListener<PetitionEvent> = async (event, ctx) => {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) {
    return;
  }

  const userIds = (await ctx.petitions.loadEffectivePermissions(petition.id)).map(
    (p) => p.user_id!
  );
  try {
    await ctx.petitions.attachPetitionEventsToUsers(event.id, userIds);
  } catch (error: any) {
    if (error.constraint === "user_petition_event_log__user_id__petition_event_id") {
      // this event is already attached, continue normally
    } else {
      throw error;
    }
  }

  const userSubscriptions = (await ctx.subscriptions.loadSubscriptionsByUserId(userIds))
    .flat()
    .filter((s) => {
      return (
        s.is_enabled &&
        (s.event_types === null || s.event_types.includes(event.type)) &&
        (s.from_template_id === null || s.from_template_id === petition.from_template_id)
      );
    });

  if (userSubscriptions.length === 0) {
    return;
  }

  const mappedEvent = mapEvent(event);
  for (const subscription of userSubscriptions) {
    try {
      const res = await fetch(subscription.endpoint, {
        method: "POST",
        body: JSON.stringify(mappedEvent),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText} for POST ${subscription.endpoint}`);
      } else if (subscription.is_failing) {
        await ctx.subscriptions.updateSubscription(
          subscription.id,
          { is_failing: false },
          `EventProcessorWorker:${event.id}`
        );
      }
    } catch (e) {
      if (!subscription.is_failing) {
        await ctx.emails.sendDeveloperWebhookFailedEmail(
          subscription.id,
          petition.id,
          (e as any)?.message ?? "",
          mappedEvent
        );
        await ctx.subscriptions.updateSubscription(
          subscription.id,
          { is_failing: true },
          `EventProcessorWorker:${event.id}`
        );
      }
    }
  }
};
