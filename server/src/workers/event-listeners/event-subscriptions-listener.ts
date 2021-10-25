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
  const subscriptions = await ctx.integrations.loadIntegrationsByOrgId(
    petition.org_id,
    "EVENT_SUBSCRIPTION"
  );
  if (subscriptions.length === 0) {
    return;
  }
  const users = new Set(
    (await ctx.petitions.loadEffectivePermissions(petition.id)).map((p) => p.user_id!)
  );

  for (const subscription of subscriptions) {
    if (users.has(subscription.settings.USER_ID)) {
      const mappedEvent = mapEvent(event);
      try {
        await fetch(subscription.settings.EVENTS_URL, {
          method: "POST",
          body: JSON.stringify(mappedEvent),
          headers: { "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await ctx.emails.sendDeveloperWebhookFailedEmail(
          subscription.id,
          petition.id,
          e.message ?? "",
          mappedEvent
        );
      }
    }
  }
};
