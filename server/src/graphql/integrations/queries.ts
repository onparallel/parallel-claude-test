import { nonNull, objectType, queryField, stringArg } from "nexus";
import { authenticateAnd } from "../helpers/authorize";
import { datetimeArg } from "../helpers/scalars";
import { userHasEnabledIntegration, userHasFeatureFlag } from "../petition/authorizers";

export const queries = queryField((t) => {
  t.paginationField("dowJonesRiskEntitySearch", {
    type: objectType({
      name: "DowJonesRiskEntitySearchResult",
      definition(t) {
        t.id("id");
        t.string("type");
        t.string("primaryName");
        t.string("title");
        t.string("countryTerritoryName");
        t.string("gender");
        t.boolean("isSubsidiary");
        t.list.string("iconHints");
        t.nullable.jsonObject("dateOfBirth");
      },
    }),
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
});
