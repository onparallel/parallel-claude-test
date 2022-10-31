import { nonNull, queryField, stringArg } from "nexus";
import { authenticateAnd } from "../helpers/authorize";
import { datetimeArg } from "../helpers/scalars";
import { userHasEnabledIntegration, userHasFeatureFlag } from "../petition/authorizers";

export const queries = queryField((t) => {
  t.paginationField("dowJonesRiskEntitySearch", {
    type: "DowJonesRiskEntitySearchResult",
    authorize: authenticateAnd(
      userHasEnabledIntegration("DOW_JONES_KYC"),
      userHasFeatureFlag("DOW_JONES_KYC")
    ),
    extendArgs: {
      name: nonNull(stringArg()),
      dateOfBirth: datetimeArg(),
    },
    resolve: async (_, args, ctx) => {
      const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
        ctx.user!.org_id,
        "DOW_JONES_KYC"
      );

      return await ctx.dowJonesKyc.riskEntitySearch(args, integration);
    },
  });

  t.field("dowJonesRiskEntityProfile", {
    type: "DowJonesRiskEntityProfileResult",
    authorize: authenticateAnd(
      userHasEnabledIntegration("DOW_JONES_KYC"),
      userHasFeatureFlag("DOW_JONES_KYC")
    ),
    args: {
      profileId: nonNull(stringArg()),
    },
    resolve: async (_, args, ctx) => {
      const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
        ctx.user!.org_id,
        "DOW_JONES_KYC"
      );

      return await ctx.dowJonesKyc.riskEntityProfile(args.profileId, integration);
    },
  });
});
