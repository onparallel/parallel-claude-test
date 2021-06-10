import fetch from "node-fetch";
import pMap from "p-map";
import { WorkerContext } from "../../context";
import { PetitionEvent } from "../../db/events";
import { ServerEvent, EventType } from "../event-processor";
import { mapEvent } from "../helpers/eventMapper";

export async function eventSubscriptionsListener(
  event: ServerEvent,
  acceptedEvents: EventType[],
  ctx: WorkerContext
) {
  if (acceptedEvents.includes(event.type) && "petition_id" in event) {
    await processEventSubscriptions(event, ctx);
  }
}

/**
 * sends a POST request to user-provided endpoints with a mapped object of the event.
 */
async function processEventSubscriptions(
  event: PetitionEvent,
  ctx: WorkerContext
) {
  const subscriptions = await ctx.subscriptions.loadSubscriptionsByPetitionId(
    event.petition_id
  );

  if (subscriptions.length > 0) {
    const mappedEvent = mapEvent(event);
    await pMap(
      subscriptions,
      async (s) => {
        try {
          await fetch(s.endpoint, {
            method: "POST",
            body: JSON.stringify(mappedEvent),
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          await ctx.emails.sendDeveloperWebhookFailedEmail(
            s.id,
            e.message ?? "",
            mappedEvent
          );
        }
      },
      { concurrency: 1 }
    );
  }
}
