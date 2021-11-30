import { inputObjectType, list, mutationField, nonNull } from "nexus";
import { isDefined } from "remeda";
import { RESULT } from "..";
import { PetitionEventSubscription } from "../../db/__types";
import { FetchService } from "../../services/fetch";
import { withError } from "../../util/promises/withError";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { validUrl } from "../helpers/validators/validUrl";
import { userHasAccessToEventSubscription } from "./authorizers";

async function challengeWebhookUrl(url: string, fetch: FetchService) {
  const [, response] = await withError(
    fetch.fetchWithTimeout(url, { method: "POST", body: JSON.stringify({}) }, 5000)
  );
  return response?.status === 200 ?? false;
}

export const createEventSubscription = mutationField("createEventSubscription", {
  description: "Creates an event subscription for the user's petitions",
  type: "PetitionEventSubscription",
  authorize: authenticate(),
  args: {
    eventsUrl: nonNull("String"),
    eventTypes: list(nonNull("PetitionEventType")),
  },
  validateArgs: validUrl((args) => args.eventsUrl, "eventsUrl"),
  resolve: async (_, args, ctx) => {
    const challengePassed = await challengeWebhookUrl(args.eventsUrl, ctx.fetch);
    if (!challengePassed) {
      throw new WhitelistedError(
        "Your URL does not seem to accept POST requests.",
        "WEBHOOK_CHALLENGE_FAILED"
      );
    }
    return await ctx.subscriptions.createSubscription(
      {
        user_id: ctx.user!.id,
        is_enabled: true,
        endpoint: args.eventsUrl,
        event_types: args.eventTypes,
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
    data: nonNull(
      inputObjectType({
        name: "UpdateEventSubscriptionInput",
        definition(t) {
          t.nullable.boolean("isEnabled");
          t.nullable.string("eventsUrl");
          t.nullable.list.nonNull.field("eventTypes", { type: "PetitionEventType" });
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    validateIf(
      (args) => isDefined(args.data.eventsUrl),
      validUrl((args) => args.data.eventsUrl, "data.eventsUrl")
    )
  ),
  resolve: async (_, args, ctx) => {
    const data: Partial<PetitionEventSubscription> = {};
    if (isDefined(args.data.eventsUrl)) {
      const challengePassed = await challengeWebhookUrl(args.data.eventsUrl, ctx.fetch);
      if (challengePassed) {
        data.endpoint = args.data.eventsUrl;
      } else {
        throw new WhitelistedError(
          "Your URL does not seem to accept POST requests.",
          "WEBHOOK_CHALLENGE_FAILED"
        );
      }
    }
    if (isDefined(args.data.isEnabled)) {
      data.is_enabled = args.data.isEnabled;
    }
    if (args.data.eventTypes !== undefined) {
      data.event_types = args.data.eventTypes;
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
      return RESULT.SUCCESS;
    } catch {}
    return RESULT.FAILURE;
  },
});
