import { inputObjectType, mutationField, nonNull } from "nexus";
import { isDefined } from "remeda";
import { OrgIntegration } from "../../db/__types";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { validIntegrationSettings } from "../helpers/validators/validIntegrationSettings";
import { userHasAccessToIntegration } from "./authorizers";

export const createOrgIntegration = mutationField("createOrgIntegration", {
  description: "Creates an integration on the user's organization",
  type: "OrgIntegration",
  authorize: authenticate(),
  args: {
    type: nonNull("IntegrationType"),
    provider: nonNull("String"),
    settings: nonNull("JSONObject"),
  },
  validateArgs: validIntegrationSettings(
    (args) => args.type,
    (args) => args.settings,
    "settings"
  ),
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.integrations.createOrgIntegration(
        {
          type: args.type,
          is_enabled: true,
          org_id: ctx.user!.org_id,
          provider: args.provider.toUpperCase(),
          settings: args.settings,
        },
        `User:${ctx.user!.id}`
      );
    } catch (error: any) {
      if (error.constraint === "org_integration__org_id__type__provider") {
        const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
          ctx.user!.org_id,
          args.type
        );
        return integration;
      } else {
        throw error;
      }
    }
  },
});

export const updateOrgIntegration = mutationField("updateOrgIntegration", {
  description: "Updates an existing integration on the user's org",
  type: "OrgIntegration",
  authorize: authenticateAnd(userHasAccessToIntegration("id")),
  args: {
    id: nonNull(globalIdArg("OrgIntegration")),
    type: nonNull("IntegrationType"),
    data: nonNull(
      inputObjectType({
        name: "UpdateOrgIntegrationInput",
        definition(t) {
          t.nullable.boolean("isEnabled");
          t.nullable.jsonObject("settings");
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    (_, args, ctx, info) => {
      if (!isDefined(args.data.isEnabled) && !isDefined(args.data.settings)) {
        throw new ArgValidationError(info, "args.data", "Update data can't be empty");
      }
    },
    validateIf(
      (args) => isDefined(args.data.settings),
      validIntegrationSettings(
        (args) => args.type,
        (args) => args.data.settings,
        "data.settings"
      )
    )
  ),
  resolve: async (_, args, ctx) => {
    const data: Partial<OrgIntegration> = {};
    if (args.data.settings) {
      data.settings = args.data.settings;
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
