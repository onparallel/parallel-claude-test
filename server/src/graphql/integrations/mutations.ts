import { booleanArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { RESULT } from "../helpers/Result";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasFeatureFlag } from "../petition/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import { userHasAccessToIntegrations } from "./authorizers";

export const markSignatureIntegrationAsDefault = mutationField(
  "markSignatureIntegrationAsDefault",
  {
    type: "IOrgIntegration",
    description: "marks a Signature integration as default",
    authorize: authenticateAnd(
      contextUserHasPermission("INTEGRATIONS:CRUD_INTEGRATIONS"),
      userHasFeatureFlag("PETITION_SIGNATURE"),
      userHasAccessToIntegrations("id", ["SIGNATURE"]),
    ),
    args: {
      id: nonNull(globalIdArg("OrgIntegration")),
    },
    resolve: async (_, { id }, ctx) => {
      return await ctx.integrations.setDefaultOrgIntegration(
        id,
        "SIGNATURE",
        ctx.user!.org_id,
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const createSignaturitIntegration = mutationField("createSignaturitIntegration", {
  description: "Creates a new Signaturit integration on the user's organization",
  type: nonNull("SignatureOrgIntegration"),
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_INTEGRATIONS"),
    userHasFeatureFlag("PETITION_SIGNATURE"),
  ),
  args: {
    name: nonNull(stringArg()),
    apiKey: nonNull(stringArg()),
    isDefault: nullable(booleanArg()),
  },
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.integrationsSetup.createSignaturitIntegration(
        {
          name: args.name,
          org_id: ctx.user!.org_id,
          is_default: args.isDefault ?? false,
        },
        args.apiKey,
        null,
        false,
        `User:${ctx.user!.id}`,
      );
    } catch {
      throw new ApolloError(`Unable to validate credentials`, "INVALID_CREDENTIALS_ERROR");
    }
  },
});

export const deleteSignatureIntegration = mutationField("deleteSignatureIntegration", {
  description:
    "Deletes a signature integration of the user's org. If there are pending signature requests using this integration, you must pass force argument to delete and cancel requests",
  type: "Result",
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_INTEGRATIONS"),
    userHasFeatureFlag("PETITION_SIGNATURE"),
    userHasAccessToIntegrations("id", ["SIGNATURE"]),
  ),
  args: {
    id: nonNull(globalIdArg("OrgIntegration")),
    force: booleanArg({ default: false }),
  },
  resolve: async (_, args, ctx) => {
    const currentSignatureIntegrations = await ctx.integrations.loadIntegrationsByOrgId(
      ctx.user!.org_id,
      "SIGNATURE",
    );

    if (currentSignatureIntegrations.length < 2) {
      throw new ApolloError(
        "There are not enough integrations to be able to delete the requested integration.",
        "INSUFFICIENT_SIGNATURE_INTEGRATIONS_ERROR",
      );
    }

    const pendingSignatures = await ctx.petitions.loadPendingSignatureRequestsByIntegrationId(
      args.id,
    );
    const pendingPetitionsWithSignatures = await ctx.petitions.loadPetitionsByOrgIntegrationId(
      args.id,
    );

    if (
      (pendingSignatures.length > 0 || pendingPetitionsWithSignatures.length > 0) &&
      !args.force
    ) {
      throw new ApolloError(
        "There are pending signature requests using this integration. Pass `force` argument to cancel this requests and delete the integration.",
        "SIGNATURE_INTEGRATION_IN_USE_ERROR",
        {
          pendingSignaturesCount: pendingPetitionsWithSignatures.length || pendingSignatures.length,
        },
      );
    }

    try {
      if (pendingPetitionsWithSignatures.length > 0) {
        await ctx.petitions.updatePetition(
          pendingPetitionsWithSignatures.flatMap((p) => p.id),
          {
            signature_config: null,
          },
          `User:${ctx.user!.id}`,
        );
      }
      if (pendingSignatures.length > 0) {
        await ctx.signature.cancelSignatureRequest(pendingSignatures, "CANCELLED_BY_USER", {
          user_id: ctx.user!.id,
        });
      }

      await ctx.integrations.deleteOrgIntegration(args.id, `User:${ctx.user!.id}`);
      return RESULT.SUCCESS;
    } catch {}
    return RESULT.FAILURE;
  },
});

export const createDowJonesKycIntegration = mutationField("createDowJonesKycIntegration", {
  description: "Creates a new Dow Jones KYC integration on the user's organization",
  type: nonNull("OrgIntegration"),
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_INTEGRATIONS"),
    userHasFeatureFlag("DOW_JONES_KYC"),
  ),
  args: {
    clientId: nonNull(stringArg()),
    username: nonNull(stringArg()),
    password: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    if (
      (await ctx.integrations.loadIntegrationsByOrgId(ctx.user!.org_id, "DOW_JONES_KYC")).length > 0
    ) {
      throw new ApolloError(
        `You already have an active Dow Jones integration`,
        "INTEGRATION_ALREADY_EXISTS_ERROR",
      );
    }

    try {
      return await ctx.integrationsSetup.createDowJonesIntegration(
        {
          org_id: ctx.user!.org_id,
          name: "Dow Jones KYC",
        },
        { CLIENT_ID: args.clientId, USERNAME: args.username, PASSWORD: args.password },
        `User:${ctx.user!.id}`,
      );
    } catch {
      throw new ApolloError(`Unable to validate credentials`, "INVALID_CREDENTIALS_ERROR");
    }
  },
});

export const deleteDowJonesKycIntegration = mutationField("deleteDowJonesKycIntegration", {
  description: "Removes the DOW JONES integration of the user's organization",
  type: nonNull("Organization"),
  authorize: authenticateAnd(
    contextUserHasPermission("INTEGRATIONS:CRUD_INTEGRATIONS"),
    userHasFeatureFlag("DOW_JONES_KYC"),
  ),
  resolve: async (_, args, ctx) => {
    const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
      ctx.user!.org_id,
      "DOW_JONES_KYC",
    );
    if (integration) {
      await ctx.integrations.deleteOrgIntegration(integration.id, `User:${ctx.user!.id}`);
      ctx.integrations.clearLoadIntegrationsByOrgIdDataloader({
        orgId: ctx.user!.org_id,
        type: "DOW_JONES_KYC",
      });
    }
    return (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
  },
});
