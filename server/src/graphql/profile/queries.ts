import { arg, inputObjectType, list, nonNull, nullable, queryField } from "nexus";
import { isDefined } from "remeda";
import { authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { userHasFeatureFlag } from "../petition/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import { userHasAccessToProfile, userHasAccessToProfileType } from "./authorizers";

export const profileTypes = queryField((t) => {
  t.paginationField("profileTypes", {
    type: "ProfileType",
    authorize: authenticateAnd(userHasFeatureFlag("PROFILES")),
    searchable: true,
    sortableBy: ["createdAt", "name" as never],
    extendArgs: {
      locale: arg({ type: "UserLocale" }),
      filter: inputObjectType({
        name: "ProfileTypeFilter",
        definition(t) {
          t.nullable.boolean("onlyArchived");
        },
      }),
    },
    validateArgs: (_, args, ctx, info) => {
      if (
        isDefined(args.sortBy) &&
        args.sortBy.some((s) => s.startsWith("name_")) &&
        !isDefined(args.locale)
      ) {
        throw new ArgValidationError(
          info,
          "locale",
          `"locale" must be provided when sorting by "name"`,
        );
      }
    },
    resolve: async (_, { filter, locale, limit, offset, search, sortBy }, ctx) => {
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
        filter,
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
      userHasAccessToProfileType("profileTypeId"),
    ),
    resolve: async (_, { profileTypeId }, ctx) => {
      return (await ctx.profiles.loadProfileType(profileTypeId))!;
    },
  });
});

export const profiles = queryField((t) => {
  t.paginationField("profiles", {
    type: "Profile",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      contextUserHasPermission("PROFILES:LIST_PROFILES"),
    ),
    searchable: true,
    sortableBy: ["createdAt", "name"],
    extendArgs: {
      filter: inputObjectType({
        name: "ProfileFilter",
        definition(t) {
          t.nullable.list.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
          t.nullable.list.nonNull.globalId("profileId", { prefixName: "Profile" });
          t.nullable.list.nonNull.field("status", { type: "ProfileStatus" });
        },
      }),
    },
    resolve: async (_, { limit, offset, search, sortBy, filter }, ctx) => {
      const columnMap = {
        createdAt: "created_at",
        name: "name",
      } as const;
      return ctx.profiles.getPaginatedProfileForOrg(ctx.user!.org_id, {
        limit,
        offset,
        search,
        filter,
        sortBy: sortBy?.map((value) => {
          const [field, order] = parseSortBy(value);
          return { field: columnMap[field], order };
        }),
      });
    },
  });
});

export const profile = queryField((t) => {
  t.field("profile", {
    type: "Profile",
    args: {
      profileId: nonNull(globalIdArg("Profile")),
    },
    authorize: authenticateAnd(userHasFeatureFlag("PROFILES"), userHasAccessToProfile("profileId")),
    resolve: async (_, { profileId }, ctx) => {
      return (await ctx.profiles.loadProfile(profileId))!;
    },
  });
});

export const expiringProfileProperties = queryField((t) => {
  t.paginationField("expiringProfileProperties", {
    type: "ProfileFieldProperty",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      contextUserHasPermission("PROFILE_ALERTS:LIST_ALERTS"),
    ),
    searchable: true,
    extendArgs: {
      filter: inputObjectType({
        name: "ProfilePropertyFilter",
        definition(t) {
          t.nullable.list.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
          t.nullable.list.nonNull.globalId("profileTypeFieldId", {
            prefixName: "ProfileTypeField",
          });
        },
      }),
    },
    resolve: async (_, { limit, offset, search, filter }, ctx) => {
      const org = (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
      return ctx.profiles.getPaginatedExpirableProfileFieldProperties(
        ctx.user!.org_id,
        org.default_timezone,
        {
          search,
          filter,
          limit,
          offset,
        },
      );
    },
  });
});

export const profileRelationshipTypesWithDirection = queryField(
  "profileRelationshipTypesWithDirection",
  {
    type: nonNull(list(nonNull("ProfileRelationshipTypeWithDirection"))),
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      ifArgDefined(
        "otherSideProfileTypeId",
        userHasAccessToProfileType("otherSideProfileTypeId" as never),
      ),
    ),
    args: {
      otherSideProfileTypeId: nullable(globalIdArg("ProfileType")),
    },
    resolve: async (_, { otherSideProfileTypeId }, ctx) => {
      try {
        const rows =
          await ctx.profiles.getProfileRelationshipTypeAllowedProfileTypesByAllowedProfileTypeId(
            ctx.user!.org_id,
            otherSideProfileTypeId ?? null,
          );
        // switch directions as we are interested in the opposite direction
        return rows.map((r) => ({
          ...r,
          direction: r.direction === "LEFT_RIGHT" ? "RIGHT_LEFT" : "LEFT_RIGHT",
        }));
      } catch (error) {
        if (error instanceof Error) {
          throw new ApolloError(error.message, "PROFILE_RELATIONSHIPS_QUERY_ERROR");
        }
        throw error;
      }
    },
  },
);
