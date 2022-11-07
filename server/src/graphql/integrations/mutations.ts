import { ApolloError } from "apollo-server-core";
import { booleanArg, mutationField, nonNull, nullable, objectType, stringArg } from "nexus";
import { withError } from "../../util/promises/withError";
import { encrypt } from "../../util/token";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { validEmail } from "../helpers/validators/validEmail";
import { userHasFeatureFlag } from "../petition/authorizers";
import { contextUserHasRole } from "../users/authorizers";
import { userHasAccessToIntegrations } from "./authorizers";

export const markSignatureIntegrationAsDefault = mutationField(
  "markSignatureIntegrationAsDefault",
  {
    type: "IOrgIntegration",
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

export const validateSignatureCredentials = mutationField("validateSignatureCredentials", {
  description: "Runs backend checks to validate signature credentials.",
  type: objectType({
    name: "ValidateSignatureCredentialsResult",
    definition(t) {
      t.nonNull.boolean("success");
      t.nullable.jsonObject("data");
    },
  }),
  authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("PETITION_SIGNATURE")),
  args: {
    provider: nonNull("SignatureOrgIntegrationProvider"),
    credentials: nonNull("JSONObject"),
  },
  resolve: async (_, args, ctx) => {
    try {
      const data = await ctx.signature
        .getClient({ provider: args.provider, settings: { CREDENTIALS: args.credentials as any } })
        .authenticate();
      return { success: true, data };
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
    const [error, data] = await withError(
      ctx.signature
        .getClient({ provider: "SIGNATURIT", settings: { CREDENTIALS: { API_KEY: args.apiKey } } })
        .authenticate()
    );
    if (error || !data.environment) {
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
          ENVIRONMENT: data.environment,
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

export const validateDowJonesFactivaCredentials = mutationField(
  "validateDowJonesFactivaCredentials",
  {
    description: "Tries to get an access_token with provided credentials",
    type: "Boolean",
    authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("DOW_JONES_KYC")),
    args: {
      clientId: nonNull(stringArg()),
      username: nonNull(stringArg()),
      password: nonNull(stringArg()),
    },
    validateArgs: validEmail((args) => args.username, "username", true),
    resolve: async (_, args, ctx) => {
      try {
        await ctx.dowJonesKyc.fetchCredentials(args.clientId, args.username, args.password);
        return true;
      } catch {
        return false;
      }
    },
  }
);

export const createDowJonesFactivaIntegration = mutationField("createDowJonesFactivaIntegration", {
  description: "Creates a new DOW JONES Factiva integration on the user's organization",
  type: nonNull("OrgIntegration"),
  authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("DOW_JONES_KYC")),
  args: {
    clientId: nonNull(stringArg()),
    username: nonNull(stringArg()),
    password: nonNull(stringArg()),
  },
  validateArgs: validEmail((args) => args.username, "username", true),
  resolve: async (_, args, ctx) => {
    if (
      (await ctx.integrations.loadIntegrationsByOrgId(ctx.user!.org_id, "DOW_JONES_KYC")).length > 0
    ) {
      throw new ApolloError(
        `You already have an active Dow Jones integration`,
        "INTEGRATION_ALREADY_EXISTS_ERROR"
      );
    }

    const [error, credentials] = await withError(
      ctx.dowJonesKyc.fetchCredentials(args.clientId, args.username, args.password)
    );
    if (error || !credentials) {
      throw new ApolloError(`Unable to validate credentials`, "INVALID_CREDENTIALS_ERROR");
    }

    const encryptionKey = Buffer.from(ctx.config.security.encryptKeyBase64, "base64");
    return await ctx.integrations.createOrgIntegration<"DOW_JONES_KYC">(
      {
        type: "DOW_JONES_KYC",
        provider: "FACTIVA",
        org_id: ctx.user!.org_id,
        name: "Dow Jones - Factiva KYC",
        settings: {
          CREDENTIALS: {
            ACCESS_TOKEN: encrypt(credentials.ACCESS_TOKEN, encryptionKey).toString("hex"),
            REFRESH_TOKEN: encrypt(credentials.REFRESH_TOKEN, encryptionKey).toString("hex"),
            CLIENT_ID: encrypt(credentials.CLIENT_ID, encryptionKey).toString("hex"),
            USERNAME: credentials.USERNAME,
            PASSWORD: encrypt(credentials.PASSWORD, encryptionKey).toString("hex"),
          },
        },
        is_enabled: true,
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const deleteDowJonesFactivaIntegration = mutationField("deleteDowJonesFactivaIntegration", {
  description: "Removes the DOW JONES integration of the user's organization",
  type: nonNull("Organization"),
  authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("DOW_JONES_KYC")),
  resolve: async (_, args, ctx) => {
    const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
      ctx.user!.org_id,
      "DOW_JONES_KYC"
    );
    if (integration) {
      await ctx.integrations.deleteOrgIntegration(integration.id, `User:${ctx.user!.id}`);
    }
    return (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
  },
});
