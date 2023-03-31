import { arg, nonNull, queryField } from "nexus";
import { isDefined } from "remeda";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { userHasFeatureFlag } from "../petition/authorizers";
import { userHasAccessToProfileType } from "./authorizers";

export const profileTypesQuery = queryField((t) => {
  t.paginationField("profileTypes", {
    type: "ProfileType",
    authorize: authenticateAnd(userHasFeatureFlag("PROFILES")),
    searchable: true,
    sortableBy: ["createdAt", "name" as never],
    extendArgs: {
      locale: arg({ type: "UserLocale" }),
    },
    resolve: async (_, { locale, limit, offset, search, sortBy }, ctx) => {
      if (sortBy?.some((s) => s.startsWith("name_")) && !isDefined(locale)) {
        throw new ApolloError(`"locale" must be provided when sorting by "name"`);
      }
      const columnMap = {
        createdAt: "created_at",
        name: "name",
      } as const;
      return ctx.profiles.getPaginatedProfileTypesForOrg(ctx.user!.org_id, {
        limit,
        offset,
        search,
        locale: locale ?? "en",
        sortBy: sortBy?.map((value) => {
          const [field, order] = parseSortBy(value);
          return { field: columnMap[field], order };
        }),
      });
    },
  });
});

export const profileType = queryField((t) => {
  t.field("profileType", {
    type: "ProfileType",
    args: {
      profileTypeId: nonNull(globalIdArg("ProfileType")),
    },
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      userHasAccessToProfileType("profileTypeId")
    ),
    resolve: async (_, { profileTypeId }, ctx) => {
      return (await ctx.profiles.loadProfileType(profileTypeId))!;
    },
  });
});
