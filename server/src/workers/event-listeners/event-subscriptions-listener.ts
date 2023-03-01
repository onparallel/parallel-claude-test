import { sign } from "crypto";
import pMap from "p-map";
import { PetitionEvent } from "../../db/events";
import { mapEvent } from "../../util/eventMapper";
import { decrypt } from "../../util/token";
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

  const subscriptionKeys = (
    await ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(
      userSubscriptions.map((s) => s.id)
    )
  ).flat();

  const mappedEvent = mapEvent(event);

  await pMap(
    userSubscriptions,
    async (subscription) => {
      try {
        const body = JSON.stringify(mappedEvent);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webooks (https://www.onparallel.com)",
        };

        const keys = subscriptionKeys.filter((k) => k.event_subscription_id === subscription.id);

        keys.forEach((key, i) => {
          const privateKey = decrypt(
            Buffer.from(key.private_key, "base64"),
            Buffer.from(ctx.config.security.encryptKeyBase64, "base64")
          ).toString();

          headers[`X-Parallel-Signature-${i + 1}`] = sign(null, Buffer.from(body), {
            key: Buffer.from(privateKey, "base64"),
            format: "der",
            type: "pkcs8",
          }).toString("base64");
        });

        const response = await ctx.fetch.fetch(subscription.endpoint, {
          method: "POST",
          body,
          headers,
          maxRetries: 3,
          delay: 5_000,
        });
        if (!response.ok) {
          throw new Error(
            `Error ${response.status}: ${response.statusText} for POST ${subscription.endpoint}`
          );
        }
        if (subscription.is_failing) {
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
    },
    { concurrency: 10 }
  );
};
