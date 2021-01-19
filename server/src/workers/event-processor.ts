import { mapSeries } from "async";
import fetch from "node-fetch";
import { PetitionEvent } from "../db/__types";
import { EventParser } from "./helpers/eventParser";
import { createQueueWorker } from "./helpers/createQueueWorker";

createQueueWorker(
  "event-processor",
  async ({ event }: { event: PetitionEvent }, ctx) => {
    const subscriptions = await ctx.subscriptions.loadSubscriptionsByPetitionId(
      event.petition_id
    );

    if (subscriptions.length > 0) {
      const parsedEvent = EventParser.parse(event);
      await mapSeries(subscriptions, async (s) => {
        try {
          await fetch(s.endpoint, {
            method: "POST",
            body: JSON.stringify(parsedEvent),
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          await ctx.emails.sendDeveloperWebhookFailedEmail(
            s.id,
            e.message ?? "",
            parsedEvent
          );
        }
      });
    }
  }
);
