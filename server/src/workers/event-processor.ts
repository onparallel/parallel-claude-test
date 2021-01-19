import { mapSeries } from "async";
import fetch from "node-fetch";
import { PetitionEvent } from "../db/__types";
import { EntityDeserializer } from "./deserializers/EntityDeserializer";
import { createQueueWorker } from "./helpers/createQueueWorker";

createQueueWorker(
  "event-processor",
  async ({ event }: { event: PetitionEvent }, ctx) => {
    const subscriptions = await ctx.userSubscriptions.loadSubscriptions(
      event.petition_id,
      event.type
    );

    if (subscriptions.length > 0) {
      const ed = new EntityDeserializer(ctx);
      const eventData = await ed.deserialize(event);
      await mapSeries(subscriptions, async (s) => {
        await fetch(s.endpoint, {
          method: "POST",
          body: JSON.stringify(eventData),
          headers: { "Content-Type": "application/json" },
        });
      });
    }
  }
);
