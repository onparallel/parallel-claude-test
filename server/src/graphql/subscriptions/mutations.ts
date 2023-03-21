import { booleanArg, list, mutationField, nonNull, stringArg } from "nexus";
import { isDefined } from "remeda";
import { PetitionEventSubscription } from "../../db/__types";
import { IFetchService } from "../../services/fetch";
import { generateEDKeyPair } from "../../util/keyPairs";
import { withError } from "../../util/promises/withError";
import { and, authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { validUrl } from "../helpers/validators/validUrl";
import { petitionsAreOfTypeTemplate, userHasAccessToPetitions } from "../petition/authorizers";
import {
  eventSubscriptionHasSignatureKeysLessThan,
  userHasAccessToEventSubscription,
  userHasAccessToEventSubscriptionSignatureKeys,
} from "./authorizers";

async function challengeWebhookUrl(url: string, fetch: IFetchService) {
  const [, response] = await withError(
    fetch.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
      } as any,
      body: JSON.stringify({}),
      timeout: 5_000,
    })
  );
  return response?.status === 200 ?? false;
}

export const createEventSubscription = mutationField("createEventSubscription", {
  description: "Creates an event subscription for the user's petitions",
  type: "PetitionEventSubscription",
  authorize: authenticateAnd(
    ifArgDefined(
      "fromTemplateId",
      and(
        petitionsAreOfTypeTemplate("fromTemplateId" as never),
        userHasAccessToPetitions("fromTemplateId" as never)
      )
    )
  ),
  args: {
    eventsUrl: nonNull(stringArg()),
    eventTypes: list(nonNull("PetitionEventType")),
    name: stringArg(),
    fromTemplateId: globalIdArg("Petition"),
  },
  validateArgs: validUrl((args) => args.eventsUrl, "eventsUrl"),
  resolve: async (_, args, ctx) => {
    const challengePassed = await challengeWebhookUrl(args.eventsUrl, ctx.fetch);
    if (!challengePassed) {
      throw new ApolloError(
        "Your URL does not seem to accept POST requests.",
        "WEBHOOK_CHALLENGE_FAILED"
      );
    }
    return await ctx.subscriptions.createSubscription(
      {
        name: args.name?.trim() || null,
        user_id: ctx.user!.id,
        is_enabled: true,
        endpoint: args.eventsUrl,
        event_types: args.eventTypes,
        from_template_id: args.fromTemplateId,
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const updateEventSubscription = mutationField("updateEventSubscription", {
  description: "Updates an existing event subscription for the user's petitions",
  type: "PetitionEventSubscription",
  authorize: authenticateAnd(userHasAccessToEventSubscription("id")),
  args: {
    id: nonNull(globalIdArg("PetitionEventSubscription")),
    isEnabled: booleanArg(),
    eventsUrl: stringArg(),
    eventTypes: list(nonNull("PetitionEventType")),
    name: stringArg(),
    fromTemplateId: globalIdArg("Petition"),
  },
  validateArgs: validUrl((args) => args.eventsUrl, "eventsUrl"),
  resolve: async (_, args, ctx) => {
    const data: Partial<PetitionEventSubscription> = {};
    if (isDefined(args.isEnabled)) {
      data.is_enabled = args.isEnabled;
    }
    if (isDefined(args.eventsUrl)) {
      const challengePassed = await challengeWebhookUrl(args.eventsUrl, ctx.fetch);
      if (!challengePassed) {
        throw new ApolloError(
          "Your URL does not seem to accept POST requests.",
          "WEBHOOK_CHALLENGE_FAILED"
        );
      }
      data.endpoint = args.eventsUrl;
    }
    if (args.name !== undefined) {
      data.name = args.name?.trim() ?? null;
    }
    if (args.eventTypes !== undefined) {
      data.event_types = args.eventTypes;
    }
    if (args.fromTemplateId !== undefined) {
      data.from_template_id = args.fromTemplateId;
    }
    return await ctx.subscriptions.updateSubscription(args.id, data, `User:${ctx.user!.id}`);
  },
});

export const deleteEventSubscriptions = mutationField("deleteEventSubscriptions", {
  type: "Result",
  description: "Deletes event subscriptions",
  authorize: authenticateAnd(userHasAccessToEventSubscription("ids")),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("PetitionEventSubscription")))),
  },
  resolve: async (_, { ids }, ctx) => {
    try {
      await ctx.subscriptions.deleteSubscriptions(ids, `User:${ctx.user!.id}`);
      await ctx.subscriptions.deleteEventSubscriptionSignatureKeysBySubscriptionIds(
        ids,
        `User:${ctx.user!.id}`
      );
      return RESULT.SUCCESS;
    } catch {}
    return RESULT.FAILURE;
  },
});

export const createEventSubscriptionSignatureKey = mutationField(
  "createEventSubscriptionSignatureKey",
  {
    description: "Creates a pair of asymmetric keys to be used for signing webhook events",
    type: "EventSubscriptionSignatureKey",
    authorize: authenticateAnd(
      userHasAccessToEventSubscription("subscriptionId"),
      eventSubscriptionHasSignatureKeysLessThan("subscriptionId", 5)
    ),
    args: {
      subscriptionId: nonNull(globalIdArg("PetitionEventSubscription")),
    },
    resolve: async (_, { subscriptionId }, ctx) => {
      const { privateKey, publicKey } = generateEDKeyPair();
      return await ctx.subscriptions.createEventSubscriptionSignatureKey(
        {
          event_subscription_id: subscriptionId,
          public_key: publicKey.toString("base64"),
          private_key: ctx.encryption.encrypt(privateKey.toString("base64"), "base64"),
        },
        `User:${ctx.user!.id}`
      );
    },
  }
);

export const deleteEventSubscriptionSignatureKeys = mutationField(
  "deleteEventSubscriptionSignatureKeys",
  {
    description: "Deletes a subscription signature key",
    type: "Result",
    authorize: authenticateAnd(userHasAccessToEventSubscriptionSignatureKeys("ids")),
    args: {
      ids: nonNull(list(nonNull(globalIdArg("EventSubscriptionSignatureKey")))),
    },
    resolve: async (_, { ids }, ctx) => {
      try {
        await ctx.subscriptions.deleteEventSubscriptionSignatureKeys(ids, `User:${ctx.user!.id}`);
        return RESULT.SUCCESS;
      } catch {}
      return RESULT.FAILURE;
    },
  }
);
