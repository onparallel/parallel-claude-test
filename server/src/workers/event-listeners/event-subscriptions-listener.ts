import fetch from "node-fetch";
import { WorkerContext } from "../../context";
import { PetitionEvent } from "../../db/events";
import { EventListener } from "../event-processor";
import { mapEvent } from "../helpers/eventMapper";

export const eventSubscriptionsListener: EventListener<PetitionEvent> = async (
  event: PetitionEvent,
  ctx: WorkerContext
) => {
  const subscriptions = await ctx.subscriptions.loadSubscriptionsByPetitionId(
    event.petition_id
  );

  for (const subscription of subscriptions) {
    const mappedEvent = mapEvent(event);
    try {
      await fetch(subscription.endpoint, {
        method: "POST",
        body: JSON.stringify(mappedEvent),
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      await ctx.emails.sendDeveloperWebhookFailedEmail(
        subscription.id,
        e.message ?? "",
        mappedEvent
      );
    }
  }
};
