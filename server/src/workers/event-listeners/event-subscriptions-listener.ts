import fetch from "node-fetch";
import { WorkerContext } from "../../context";
import { PetitionEvent } from "../../db/events";
import { EventListener } from "../event-processor";
import { mapEvent } from "../helpers/eventMapper";

export const eventSubscriptionsListener: EventListener<PetitionEvent> = async (
  event: PetitionEvent,
  ctx: WorkerContext
) => {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) {
    return;
  }

  const userIds = (await ctx.petitions.loadEffectivePermissions(petition.id)).map(
    (p) => p.user_id!
  );

  const userSubscriptions = (await ctx.subscriptions.loadSubscriptionsByUserId(userIds))
    .flat()
    .filter((s) => {
      return s.is_enabled && (s.event_types === null || s.event_types.includes(event.type));
    });

  if (userSubscriptions.length === 0) {
    return;
  }

  const mappedEvent = mapEvent(event);
  for (const subscription of userSubscriptions) {
    try {
      const { status, statusText } = await fetch(subscription.endpoint, {
        method: "POST",
        body: JSON.stringify(mappedEvent),
        headers: { "Content-Type": "application/json" },
      });

      if (status !== 200) {
        await ctx.emails.sendDeveloperWebhookFailedEmail(
          subscription.id,
          petition.id,
          `Error ${status}: ${statusText} for POST ${subscription.endpoint}`,
          mappedEvent
        );
      }
    } catch (e: any) {
      await ctx.emails.sendDeveloperWebhookFailedEmail(
        subscription.id,
        petition.id,
        e.message ?? "",
        mappedEvent
      );
    }
  }
};
