import { sign } from "crypto";
import stringify from "fast-safe-stringify";
import pMap from "p-map";
import { isDefined } from "remeda";
import { PetitionEvent } from "../../db/events/PetitionEvent";
import { mapEvent } from "../../util/eventMapper";
import { pFilter } from "../../util/promises/pFilter";
import { EventListener } from "../event-processor";

export const eventSubscriptionsListener: EventListener<PetitionEvent> = async (event, ctx) => {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) {
    return;
  }

  const userIds = (await ctx.petitions.loadEffectivePermissions(petition.id)).map(
    (p) => p.user_id!,
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

  const activeSubscriptions = (await ctx.subscriptions.loadSubscriptionsByUserId(userIds)).flat();

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

  const subscriptionKeys = (
    await ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(
      userSubscriptions.map((s) => s.id),
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
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
        };

        const keys = subscriptionKeys.filter((k) => k.event_subscription_id === subscription.id);

        keys.forEach((key, i) => {
          const privateKey = ctx.encryption.decrypt(Buffer.from(key.private_key, "base64"));
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
          timeout: 15_000,
        });
        if (!response.ok) {
          throw new Error(
            `Error ${response.status}: ${response.statusText} for POST ${subscription.endpoint}`,
          );
        }
        if (subscription.is_failing) {
          await ctx.subscriptions.updateSubscription(
            subscription.id,
            { is_failing: false },
            ctx.config.instanceName,
          );
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : stringify(e);
        if (!subscription.is_failing) {
          await ctx.emails.sendDeveloperWebhookFailedEmail(
            subscription.id,
            petition.id,
            errorMessage,
            mappedEvent,
          );
        }
        await ctx.subscriptions.appendErrorLog(
          subscription.id,
          { error: errorMessage, event: mappedEvent },
          ctx.config.instanceName,
        );
      }
    },
    { concurrency: 10 },
  );
};
