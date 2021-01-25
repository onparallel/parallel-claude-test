import fetch from "node-fetch";
import { PetitionEvent } from "../db/events";
import { mapEvent } from "./helpers/eventMapper";
import { createQueueWorker } from "./helpers/createQueueWorker";
import pMap from "p-map";

createQueueWorker(
  "event-processor",
  async ({ event }: { event: PetitionEvent }, ctx) => {
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
);
