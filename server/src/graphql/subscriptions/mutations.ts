import { booleanArg, list, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isNonNullish } from "remeda";
import { EventSubscription } from "../../db/__types";
import { IFetchService } from "../../services/FetchService";
import { generateEDKeyPair } from "../../util/keyPairs";
import { withError } from "../../util/promises/withError";
import { RESULT } from "../helpers/Result";
import { and, argIsDefined, authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd } from "../helpers/validateArgs";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { validUrl } from "../helpers/validators/validUrl";
import { petitionsAreOfTypeTemplate, userHasAccessToPetitions } from "../petition/authorizers";
import {
  profileTypeFieldBelongsToProfileType,
  userHasAccessToProfileType,
} from "../profile/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import {
  eventSubscriptionHasSignatureKeysLessThan,
  petitionFieldsBelongsToTemplate,
  userHasAccessToEventSubscription,
  userHasAccessToEventSubscriptionSignatureKeys,
} from "./authorizers";

async function challengeWebhookUrl(url: string, fetch: IFetchService, headers?: HeadersInit) {
  const [, response] = await withError(
    fetch.fetch(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Parallel Webhooks (https://www.onparallel.com)",
          ...headers,
        } as any,
        body: JSON.stringify({}),
      },
      { timeout: 5_000 },
    ),
  );
  return response?.status === 200 ?? false;
}

export const createEventSubscriptionSignatureKey = mutationField(
  "createEventSubscriptionSignatureKey",
  {
    description: "Creates a pair of asymmetric keys to be used for signing webhook events",
    type: "EventSubscriptionSignatureKey",
    authorize: authenticateAnd(
      contextUserHasPermission("INTEGRATIONS:CRUD_API"),
      userHasAccessToEventSubscription("subscriptionId"),
      eventSubscriptionHasSignatureKeysLessThan("subscriptionId", 5),
    ),
    args: {
      subscriptionId: nonNull(
        globalIdArg({ allowedPrefixes: ["PetitionEventSubscription", "ProfileEventSubscription"] }),
      ),
    },
    resolve: async (_, { subscriptionId }, ctx) => {
      const { privateKey, publicKey } = generateEDKeyPair();
      return await ctx.subscriptions.createEventSubscriptionSignatureKey(
        {
          event_subscription_id: subscriptionId,
          public_key: publicKey.toString("base64"),
          private_key: ctx.encryption.encrypt(privateKey.toString("base64"), "base64"),
        },
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const deleteEventSubscriptionSignatureKeys = mutationField(
  "deleteEventSubscriptionSignatureKeys",
  {
    description: "Deletes a subscription signature key",
    type: "Result",
    authorize: authenticateAnd(
      contextUserHasPermission("INTEGRATIONS:CRUD_API"),
      userHasAccessToEventSubscriptionSignatureKeys("ids"),
    ),
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
  },
);

export const createPetitionEventSubscription = mutationField("createPetitionEventSubscription", {
  description: "Creates an event subscription for the user's petitions",
  type: "PetitionEventSubscription",
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_API"),
    ifArgDefined(
      "fromTemplateId",
      and(
        petitionsAreOfTypeTemplate("fromTemplateId" as never),
        userHasAccessToPetitions("fromTemplateId" as never),
      ),
    ),
    ifArgDefined(
      "fromTemplateFieldIds",
      and(
        argIsDefined("fromTemplateId"),
        petitionFieldsBelongsToTemplate("fromTemplateFieldIds" as never, "fromTemplateId" as never),
      ),
    ),
  ),
  args: {
    eventsUrl: nonNull(stringArg()),
    eventTypes: list(nonNull("PetitionEventType")),
    name: stringArg(),
    fromTemplateId: globalIdArg("Petition"),
    fromTemplateFieldIds: list(nonNull(globalIdArg("PetitionField"))),
    challenge: nullable(booleanArg()),
  },
  validateArgs: validateAnd(
    validUrl((args) => args.eventsUrl, "eventsUrl"),
    notEmptyArray((args) => args.fromTemplateFieldIds, "fromTemplateFieldIds"),
  ),
  resolve: async (_, args, ctx) => {
    const challengePassed =
      args.challenge === false || (await challengeWebhookUrl(args.eventsUrl, ctx.fetch));
    if (!challengePassed) {
      throw new ApolloError(
        "Your URL does not seem to accept POST requests.",
        "WEBHOOK_CHALLENGE_FAILED",
      );
    }
    return await ctx.subscriptions.createEventSubscription(
      {
        type: "PETITION",
        name: args.name?.trim() || null,
        user_id: ctx.user!.id,
        is_enabled: true,
        endpoint: args.eventsUrl,
        event_types: args.eventTypes,
        from_template_id: args.fromTemplateId,
        from_template_field_ids: args.fromTemplateFieldIds,
      },
      `User:${ctx.user!.id}`,
    );
  },
});

export const createProfileEventSubscription = mutationField("createProfileEventSubscription", {
  description: "Creates an event subscription for the user's profiles",
  type: "ProfileEventSubscription",
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_API"),
    ifArgDefined("fromProfileTypeId", userHasAccessToProfileType("fromProfileTypeId" as never)),
    ifArgDefined(
      "fromProfileTypeFieldIds",
      and(
        argIsDefined("fromProfileTypeId"),
        profileTypeFieldBelongsToProfileType(
          "fromProfileTypeFieldIds" as never,
          "fromProfileTypeId" as never,
        ),
      ),
    ),
  ),
  args: {
    eventsUrl: nonNull(stringArg()),
    eventTypes: list(nonNull("ProfileEventType")),
    name: stringArg(),
    fromProfileTypeId: globalIdArg("ProfileType"),
    fromProfileTypeFieldIds: list(nonNull(globalIdArg("ProfileTypeField"))),
    challenge: nullable(booleanArg()),
  },
  validateArgs: validateAnd(
    validUrl((args) => args.eventsUrl, "eventsUrl"),
    notEmptyArray((args) => args.fromProfileTypeFieldIds, "fromProfileTypeFieldIds"),
  ),
  resolve: async (_, args, ctx) => {
    const challengePassed =
      args.challenge === false || (await challengeWebhookUrl(args.eventsUrl, ctx.fetch));
    if (!challengePassed) {
      throw new ApolloError(
        "Your URL does not seem to accept POST requests.",
        "WEBHOOK_CHALLENGE_FAILED",
      );
    }
    return await ctx.subscriptions.createEventSubscription(
      {
        type: "PROFILE",
        name: args.name?.trim() || null,
        user_id: ctx.user!.id,
        is_enabled: true,
        endpoint: args.eventsUrl,
        event_types: args.eventTypes,
        from_profile_type_id: args.fromProfileTypeId,
        from_profile_type_field_ids: args.fromProfileTypeFieldIds,
      },
      `User:${ctx.user!.id}`,
    );
  },
});

export const updatePetitionEventSubscription = mutationField("updatePetitionEventSubscription", {
  description: "Updates an existing event subscription for the user's petitions",
  type: "PetitionEventSubscription",
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_API"),
    userHasAccessToEventSubscription("id"),
    ifArgDefined(
      "fromTemplateId",
      and(
        petitionsAreOfTypeTemplate("fromTemplateId" as never),
        userHasAccessToPetitions("fromTemplateId" as never),
      ),
    ),
    ifArgDefined(
      "fromTemplateFieldIds",
      and(
        argIsDefined("fromTemplateId"),
        petitionFieldsBelongsToTemplate("fromTemplateFieldIds" as never, "fromTemplateId" as never),
      ),
    ),
  ),
  args: {
    id: nonNull(globalIdArg("PetitionEventSubscription")),
    isEnabled: booleanArg(),
    eventsUrl: stringArg(),
    eventTypes: list(nonNull("PetitionEventType")),
    name: stringArg(),
    fromTemplateId: globalIdArg("Petition"),
    fromTemplateFieldIds: list(nonNull(globalIdArg("PetitionField"))),
  },
  validateArgs: validateAnd(
    validUrl((args) => args.eventsUrl, "eventsUrl"),
    notEmptyArray((args) => args.fromTemplateFieldIds, "fromTemplateFieldIds"),
  ),
  resolve: async (_, args, ctx) => {
    const data: Partial<EventSubscription> = {};
    if (isNonNullish(args.isEnabled)) {
      data.is_enabled = args.isEnabled;
    }
    if (isNonNullish(args.eventsUrl)) {
      const keys = await ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(
        args.id,
      );
      const headers = ctx.eventSubscription.buildSubscriptionSignatureHeaders(
        keys,
        args.eventsUrl,
        "{}",
      );
      const challengePassed = await challengeWebhookUrl(args.eventsUrl, ctx.fetch, headers);
      if (!challengePassed) {
        throw new ApolloError(
          "Your URL does not seem to accept POST requests.",
          "WEBHOOK_CHALLENGE_FAILED",
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
    if (args.fromTemplateFieldIds !== undefined) {
      data.from_template_field_ids = args.fromTemplateFieldIds;
    }

    return await ctx.subscriptions.updateEventSubscription(args.id, data, `User:${ctx.user!.id}`);
  },
});

export const updateProfileEventSubscription = mutationField("updateProfileEventSubscription", {
  description: "Updates an existing event subscription for the user's profiles",
  type: "ProfileEventSubscription",
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_API"),
    userHasAccessToEventSubscription("id"),
    ifArgDefined("fromProfileTypeId", userHasAccessToProfileType("fromProfileTypeId" as never)),
    ifArgDefined(
      "fromProfileTypeFieldIds",
      and(
        argIsDefined("fromProfileTypeId"),
        profileTypeFieldBelongsToProfileType(
          "fromProfileTypeFieldIds" as never,
          "fromProfileTypeId" as never,
        ),
      ),
    ),
  ),
  args: {
    id: nonNull(globalIdArg("ProfileEventSubscription")),
    isEnabled: booleanArg(),
    eventsUrl: stringArg(),
    eventTypes: list(nonNull("ProfileEventType")),
    name: stringArg(),
    fromProfileTypeId: globalIdArg("ProfileType"),
    fromProfileTypeFieldIds: list(nonNull(globalIdArg("ProfileTypeField"))),
  },
  validateArgs: validateAnd(
    validUrl((args) => args.eventsUrl, "eventsUrl"),
    notEmptyArray((args) => args.fromProfileTypeFieldIds, "fromProfileTypeFieldIds"),
  ),
  resolve: async (_, args, ctx) => {
    const data: Partial<EventSubscription> = {};
    if (isNonNullish(args.isEnabled)) {
      data.is_enabled = args.isEnabled;
    }
    if (isNonNullish(args.eventsUrl)) {
      const keys = await ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(
        args.id,
      );
      const headers = ctx.eventSubscription.buildSubscriptionSignatureHeaders(
        keys,
        args.eventsUrl,
        "{}",
      );
      const challengePassed = await challengeWebhookUrl(args.eventsUrl, ctx.fetch, headers);
      if (!challengePassed) {
        throw new ApolloError(
          "Your URL does not seem to accept POST requests.",
          "WEBHOOK_CHALLENGE_FAILED",
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
    if (args.fromProfileTypeId !== undefined) {
      data.from_profile_type_id = args.fromProfileTypeId;
    }
    if (args.fromProfileTypeFieldIds !== undefined) {
      data.from_profile_type_field_ids = args.fromProfileTypeFieldIds;
    }

    return await ctx.subscriptions.updateEventSubscription(args.id, data, `User:${ctx.user!.id}`);
  },
});

export const deleteEventSubscriptions = mutationField("deleteEventSubscriptions", {
  type: "Result",
  description: "Deletes event subscriptions",
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_API"),
    userHasAccessToEventSubscription("ids"),
  ),
  args: {
    ids: nonNull(
      list(
        nonNull(
          globalIdArg({
            allowedPrefixes: ["PetitionEventSubscription", "ProfileEventSubscription"],
          }),
        ),
      ),
    ),
  },
  resolve: async (_, { ids }, ctx) => {
    try {
      await ctx.subscriptions.deleteEventSubscriptions(ids, `User:${ctx.user!.id}`);
      await ctx.subscriptions.deleteEventSubscriptionSignatureKeysBySubscriptionIds(
        ids,
        `User:${ctx.user!.id}`,
      );
      return RESULT.SUCCESS;
    } catch {}
    return RESULT.FAILURE;
  },
});
