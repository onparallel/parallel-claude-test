import { ApolloError } from "apollo-server-core";
import { arg, booleanArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { withError } from "../../util/promises/withError";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { userHasFeatureFlag } from "../petition/authorizers";
import { contextUserHasRole } from "../users/authorizers";
import { userHasAccessToIntegrations } from "./authorizers";

export const markSignatureIntegrationAsDefault = mutationField(
  "markSignatureIntegrationAsDefault",
  {
    type: "OrgIntegration",
    description: "marks a Signature integration as default",
    authorize: authenticateAnd(
      contextUserHasRole("ADMIN"),
      userHasFeatureFlag("PETITION_SIGNATURE"),
      userHasAccessToIntegrations("id", ["SIGNATURE"])
    ),
    args: {
      id: nonNull(globalIdArg("OrgIntegration")),
    },
    resolve: async (_, { id }, ctx) => {
      return await ctx.integrations.setDefaultOrgIntegration(id, "SIGNATURE", ctx.user!);
    },
  }
);

export const createSignatureIntegration = mutationField("createSignatureIntegration", {
  deprecation: "use createSignaturitIntegration",
  description: "Creates a new signature integration on the user's organization",
  type: nonNull("SignatureOrgIntegration"),
  authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("PETITION_SIGNATURE")),
  args: {
    name: nonNull(stringArg()),
    provider: nonNull(arg({ type: "SignatureOrgIntegrationProvider" })),
    apiKey: nonNull(stringArg()),
    isDefault: nullable(booleanArg()),
  },
  resolve: async (_, args, ctx) => {
    const [error, environment] = await withError(ctx.signature.checkSignaturitApiKey(args.apiKey));
    if (error) {
      throw new ApolloError(
        `Unable to check Signaturit APIKEY environment`,
        "INVALID_APIKEY_ERROR"
      );
    }

    const newIntegration = await ctx.integrations.createOrgIntegration<"SIGNATURE", "SIGNATURIT">(
      {
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        org_id: ctx.user!.org_id,
        name: args.name,
        settings: {
          CREDENTIALS: {
            API_KEY: args.apiKey,
          },
          ENVIRONMENT: environment,
        },
        is_enabled: true,
      },
      `User:${ctx.user!.id}`
    );

    if (args.isDefault) {
      return await ctx.integrations.setDefaultOrgIntegration(
        newIntegration.id,
        "SIGNATURE",
        ctx.user!
      );
    } else {
      return newIntegration;
    }
  },
});

export const validateSignatureCredentials = mutationField("validateSignatureCredentials", {
  description: "Runs backend checks to validate signature credentials.",
  type: "JSONObject",
  authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("PETITION_SIGNATURE")),
  args: {
    provider: nonNull("SignatureOrgIntegrationProvider"),
    credentials: nonNull("JSONObject"),
  },
  resolve: async (_, args, ctx) => {
    try {
      if (args.provider === "SIGNATURIT") {
        await ctx.signature.checkSignaturitApiKey(args.credentials.API_KEY);
        return { success: true };
      }
    } catch {}
    return { success: false };
  },
});

export const createSignaturitIntegration = mutationField("createSignaturitIntegration", {
  description: "Creates a new Signaturit integration on the user's organization",
  type: nonNull("SignatureOrgIntegration"),
  authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("PETITION_SIGNATURE")),
  args: {
    name: nonNull(stringArg()),
    apiKey: nonNull(stringArg()),
    isDefault: nullable(booleanArg()),
  },
  resolve: async (_, args, ctx) => {
    const [error, environment] = await withError(ctx.signature.checkSignaturitApiKey(args.apiKey));
    if (error) {
      throw new ApolloError(
        `Unable to check Signaturit APIKEY environment`,
        "INVALID_APIKEY_ERROR"
      );
    }

    const newIntegration = await ctx.integrations.createOrgIntegration<"SIGNATURE", "SIGNATURIT">(
      {
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        org_id: ctx.user!.org_id,
        name: args.name,
        settings: {
          CREDENTIALS: {
            API_KEY: args.apiKey,
          },
          ENVIRONMENT: environment,
        },
        is_enabled: true,
      },
      `User:${ctx.user!.id}`
    );

    if (args.isDefault) {
      return await ctx.integrations.setDefaultOrgIntegration(
        newIntegration.id,
        "SIGNATURE",
        ctx.user!
      );
    } else {
      return newIntegration;
    }
  },
});

export const deleteSignatureIntegration = mutationField("deleteSignatureIntegration", {
  description:
    "Deletes a signature integration of the user's org. If there are pending signature requests using this integration, you must pass force argument to delete and cancel requests",
  type: "Result",
  authorize: authenticateAnd(
    contextUserHasRole("ADMIN"),
    userHasFeatureFlag("PETITION_SIGNATURE"),
    userHasAccessToIntegrations("id", ["SIGNATURE"])
  ),
  args: {
    id: nonNull(globalIdArg("OrgIntegration")),
    force: booleanArg({ default: false }),
  },
  resolve: async (_, args, ctx) => {
    const currentSignatureIntegrations = await ctx.integrations.loadIntegrationsByOrgId(
      ctx.user!.org_id,
      "SIGNATURE"
    );

    if (currentSignatureIntegrations.length < 2) {
      throw new ApolloError(
        "There are not enough integrations to be able to delete the requested integration.",
        "INSUFFICIENT_SIGNATURE_INTEGRATIONS_ERROR"
      );
    }

    const pendingSignatures = await ctx.petitions.loadPendingSignatureRequestsByIntegrationId(
      args.id
    );
    const pendingPetitionsWithSignatures = await ctx.petitions.loadPetitionsByOrgIntegrationId(
      args.id
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
        }
      );
    }

    try {
      if (pendingPetitionsWithSignatures.length > 0) {
        await ctx.petitions.updatePetition(
          pendingPetitionsWithSignatures.flatMap((p) => p.id),
          {
            signature_config: null,
          },
          `User:${ctx.user!.id}`
        );
      }
      if (pendingSignatures.length > 0) {
        await Promise.all([
          ctx.petitions.cancelPetitionSignatureRequest(pendingSignatures, "CANCELLED_BY_USER", {
            user_id: ctx.user!.id,
          }),
          ctx.signature.cancelSignatureRequest(pendingSignatures),
        ]);
      }

      await ctx.integrations.deleteOrgIntegration(args.id, `User:${ctx.user!.id}`);
      return RESULT.SUCCESS;
    } catch {}
    return RESULT.FAILURE;
  },
});
