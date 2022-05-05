import { ApolloError } from "apollo-server-core";
import { booleanArg, list, mutationField, nonNull, stringArg } from "nexus";
import { RESULT } from "..";
import { IFetchService } from "../../services/fetch";
import { withError } from "../../util/promises/withError";
import { and, authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validUrl } from "../helpers/validators/validUrl";
import { petitionsAreOfTypeTemplate, userHasAccessToPetitions } from "../petition/authorizers";
import { userHasAccessToEventSubscription } from "./authorizers";

async function challengeWebhookUrl(url: string, fetch: IFetchService) {
  const [, response] = await withError(
    fetch.fetchWithTimeout(url, { method: "POST", body: JSON.stringify({}) }, 5000)
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
    isEnabled: nonNull(booleanArg()),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.subscriptions.updateSubscription(
      args.id,
      { is_enabled: args.isEnabled },
      `User:${ctx.user!.id}`
    );
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
