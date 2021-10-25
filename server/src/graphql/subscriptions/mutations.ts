import { inputObjectType, mutationField, nonNull } from "nexus";
import { isDefined } from "remeda";
import { RESULT } from "..";
import { OrgIntegration } from "../../db/__types";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { ArgValidationError, WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { validIntegrationSettings } from "../helpers/validators/validIntegrationSettings";
import { userHasAccessToEventSubscription } from "./authorizers";

export const createEventSubscription = mutationField("createEventSubscription", {
  description: "Creates an event subscription for the user's petitions",
  type: "PetitionEventSubscription",
  authorize: authenticate(),
  args: {
    eventsUrl: nonNull("String"),
  },
  validateArgs: validIntegrationSettings(
    "EVENT_SUBSCRIPTION",
    (args) => ({ EVENTS_URL: args.eventsUrl }), // TODO change this, no need to use AJV
    "settings"
  ),
  resolve: async (_, args, ctx) => {
    const eventSubscriptionUserIntegrations = await ctx.integrations.loadIntegrationsByOrgId(
      ctx.user!.org_id,
      "EVENT_SUBSCRIPTION",
      true
    );
    if (eventSubscriptionUserIntegrations.some((i) => i.settings.USER_ID === ctx.user!.id)) {
      throw new WhitelistedError(`You already have a subscription`, "EXISTING_SUBSCRIPTION_ERROR");
    }

    return await ctx.integrations.createOrgIntegration(
      {
        type: "EVENT_SUBSCRIPTION",
        is_enabled: true,
        org_id: ctx.user!.org_id,
        provider: "PARALLEL",
        settings: {
          EVENTS_URL: args.eventsUrl,
          USER_ID: ctx.user!.id,
        },
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
    (_, args, ctx, info) => {
      if (!isDefined(args.data.isEnabled) && !isDefined(args.data.eventsUrl)) {
        throw new ArgValidationError(info, "args.data", "Update data can't be empty");
      }
    },
    validateIf(
      (args) => isDefined(args.data.eventsUrl),
      validIntegrationSettings(
        "EVENT_SUBSCRIPTION",
        (args) => ({ EVENTS_URL: args.data.eventsUrl }),
        "data.eventsUrl"
      )
    )
  ),
  resolve: async (_, args, ctx) => {
    const data: Partial<OrgIntegration> = {};
    if (args.data.eventsUrl) {
      data.settings = { EVENTS_URL: args.data.eventsUrl, USER_ID: ctx.user!.id };
    }
    if (isDefined(args.data.isEnabled)) {
      data.is_enabled = args.data.isEnabled;
    }
    const [integration] = await ctx.integrations.updateOrgIntegration(
      args.id,
      data,
      `User:${ctx.user!.id}`
    );
    return integration;
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
      await ctx.integrations.updateOrgIntegration(
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
