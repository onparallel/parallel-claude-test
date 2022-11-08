import { ApolloError } from "apollo-server-core";
import { idArg, nonNull, queryField, stringArg } from "nexus";
import { toGlobalId } from "../../util/globalId";
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

      const result = await ctx.dowJonesKyc.riskEntitySearch(args, integration);
      return {
        totalCount: result.meta.total_count,
        items: (result.data ?? []).map((i) => ({
          id: toGlobalId("DowJonesRiskEntitySearchResult", i.id),
          profileId: i.id,
          type: i.attributes.type,
          name: i.attributes.primary_name,
          title: i.attributes.title,
          countryTerritoryName:
            i.attributes.country_territory_code !== "NOTK"
              ? i.attributes.country_territory_name
              : null,
          isSubsidiary: i.attributes.is_subsidiary,
          iconHints: i.attributes.icon_hints,
          gender: i.attributes.gender,
          dateOfBirth: i.attributes.date_of_birth
            ? {
                year: parseInt(i.attributes.date_of_birth[0].year) || null,
                month: parseInt(i.attributes.date_of_birth[0].month) || null,
                day: parseInt(i.attributes.date_of_birth[0].day) || null,
              }
            : null,
        })),
      };
    },
  });

  t.field("dowJonesRiskEntityProfile", {
    type: "DowJonesRiskEntityProfileResult",
    authorize: authenticateAnd(
      userHasEnabledIntegration("DOW_JONES_KYC"),
      userHasFeatureFlag("DOW_JONES_KYC")
    ),
    args: {
      profileId: nonNull(idArg()),
    },
    resolve: async (_, args, ctx) => {
      try {
        const [integration] = await ctx.integrations.loadIntegrationsByOrgId(
          ctx.user!.org_id,
          "DOW_JONES_KYC"
        );

        const result = await ctx.dowJonesKyc.riskEntityProfile(args.profileId, integration);
        const citizenship = (
          result.data.attributes.person?.country_territory_details.citizenship ?? []
        ).find((c) => c.code !== "NOTK"); // NOTK is "Not Known", this info is irrelevant so we will filter it
        const jurisdiction = (
          result.data.attributes.person?.country_territory_details.jurisdiction ?? []
        ).find((c) => c.code !== "NOTK");
        const residence = (
          result.data.attributes.person?.country_territory_details.residence ?? []
        ).find((c) => c.code !== "NOTK");
        return {
          id: toGlobalId("DowJonesRiskEntityProfileResult", result.data.id),
          profileId: result.data.id,
          type: result.data.attributes.basic.type,
          name: ctx.dowJonesKyc.entityFullName(
            result.data.attributes.basic.name_details.primary_name
          ),
          iconHints:
            result.data.attributes.person?.icon_hints ??
            result.data.attributes.entity?.icon_hints ??
            [],
          sanctions: (result.data.attributes.list_reference?.sanctions_lists ?? []).map(
            (s, id) => ({
              id,
              name: s.name,
              sources: s.sources,
              fromDate: s.from_date ?? null,
            })
          ),
          relationships: (result.data.attributes.relationship?.connection_details ?? []).map(
            (r) => ({
              profileId: r.profile_id,
              type: r.type,
              connectionType: r.connection_type,
              iconHints: r.icon_hints,
              name: ctx.dowJonesKyc.entityFullName(r.name_detail),
            })
          ),
          placeOfBirth: result.data.attributes.person?.places_of_birth
            ? {
                descriptor: result.data.attributes.person!.places_of_birth[0].country.descriptor,
                countryCode: result.data.attributes.person!.places_of_birth[0].country.iso_alpha2,
              }
            : null,
          dateOfBirth: result.data.attributes.person?.date_details?.birth?.[0].date ?? null,
          citizenship: citizenship
            ? {
                descriptor: citizenship.descriptor,
                countryCode: citizenship.iso_alpha2,
              }
            : null,
          residence: residence
            ? {
                descriptor: residence.descriptor,
                countryCode: residence.iso_alpha2,
              }
            : null,
          jurisdiction: jurisdiction
            ? {
                descriptor: jurisdiction.descriptor,
                countryCode: jurisdiction.iso_alpha2,
              }
            : null,
          isDeceased: result.data.attributes.person?.is_deceased,
          dateOfRegistration:
            result.data.attributes.entity?.date_details?.registration?.[0].date ?? null,
        };
      } catch (error: any) {
        if (error.message === "PROFILE_NOT_FOUND") {
          throw new ApolloError(
            `Couldn't find profile with id ${args.profileId}`,
            "PROFILE_NOT_FOUND"
          );
        }
        throw error;
      }
    },
  });
});
