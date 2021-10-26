import { inputObjectType, mutationField, nonNull } from "nexus";
import { isDefined } from "remeda";
import { RESULT } from "..";
import { PetitionEventSubscription } from "../../db/__types";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { validUrl } from "../helpers/validators/validUrl";
import { userHasAccessToEventSubscription } from "./authorizers";

export const createEventSubscription = mutationField("createEventSubscription", {
  description: "Creates an event subscription for the user's petitions",
  type: "PetitionEventSubscription",
  authorize: authenticate(),
  args: {
    eventsUrl: nonNull("String"),
  },
  validateArgs: validUrl((args) => args.eventsUrl, "eventsUrl"),
  resolve: async (_, args, ctx) => {
    const userSubscriptions = await ctx.subscriptions.loadSubscriptionsByUserId(ctx.user!.id);
    if (userSubscriptions.length > 0) {
      throw new WhitelistedError(`You already have a subscription`, "EXISTING_SUBSCRIPTION_ERROR");
    }

    return await ctx.subscriptions.createSubscription(
      {
        user_id: ctx.user!.id,
        is_enabled: true,
        endpoint: args.eventsUrl,
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
      data.endpoint = args.data.eventsUrl;
    }
    if (isDefined(args.data.isEnabled)) {
      data.is_enabled = args.data.isEnabled;
    }
    return await ctx.subscriptions.updateSubscription(args.id, data, `User:${ctx.user!.id}`);
  },
});

export const deleteEventSubscription = mutationField("deleteEventSubscription", {
  type: "Result",
  description: "Deletes a subscription",
  authorize: authenticateAnd(userHasAccessToEventSubscription("id")),
  args: {
    id: nonNull(globalIdArg("PetitionEventSubscription")),
  },
  resolve: async (_, { id }, ctx) => {
    try {
      await ctx.subscriptions.updateSubscription(
        id,
        {
          deleted_at: new Date(),
          deleted_by: `User:${ctx.user!.id}`,
        },
        `User:${ctx.user!.id}`
      );
      return RESULT.SUCCESS;
    } catch {}
    return RESULT.FAILURE;
  },
});
