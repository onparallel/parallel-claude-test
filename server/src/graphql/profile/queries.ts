import {
  arg,
  enumType,
  inputObjectType,
  list,
  nonNull,
  nullable,
  objectType,
  queryField,
} from "nexus";
import pMap from "p-map";
import { indexBy, isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { ProfileTypeField } from "../../db/__types";
import { validateProfileFieldValuesFilter } from "../../util/ProfileFieldValuesFilter";
import { authenticate, authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { userHasFeatureFlag } from "../petition/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import {
  profileTypeFieldBelongsToProfileType,
  profileTypeFieldIsOfType,
  userHasAccessToProfile,
  userHasAccessToProfileType,
} from "./authorizers";

export const profileTypes = queryField((t) => {
  t.paginationField("profileTypes", {
    type: "ProfileType",
    authorize: authenticate(),
    searchable: true,
    sortableBy: ["createdAt", "name" as never],
    extendArgs: {
      locale: arg({ type: "UserLocale" }),
      filter: inputObjectType({
        name: "ProfileTypeFilter",
        definition(t) {
          t.nullable.boolean("onlyArchived");
          t.nullable.boolean("includeArchived");
          t.nullable.list.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
        },
      }),
    },
    validateArgs: (_, args, ctx, info) => {
      if (
        isNonNullish(args.sortBy) &&
        args.sortBy.some((s) => s.startsWith("name_")) &&
        isNullish(args.locale)
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

      const hasFeatureFlag = await ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, "PROFILES");
      if (!hasFeatureFlag) {
        return {
          items: [],
          totalCount: 0,
        };
      }
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
          t.nullable.field("values", {
            type: inputObjectType({
              name: "ProfileFieldValuesFilter",
              definition(t) {
                t.nullable.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
                t.nullable.field("operator", {
                  type: enumType({
                    name: "ProfileFieldValuesFilterOperator",
                    members: [
                      "HAS_VALUE",
                      "NOT_HAS_VALUE",
                      "EQUAL",
                      "NOT_EQUAL",
                      "START_WITH",
                      "END_WITH",
                      "CONTAIN",
                      "NOT_CONTAIN",
                      "IS_ONE_OF",
                      "NOT_IS_ONE_OF",
                      "LESS_THAN",
                      "LESS_THAN_OR_EQUAL",
                      "GREATER_THAN",
                      "GREATER_THAN_OR_EQUAL",
                      "HAS_BG_CHECK_RESULTS",
                      "NOT_HAS_BG_CHECK_RESULTS",
                      "HAS_BG_CHECK_MATCH",
                      "NOT_HAS_BG_CHECK_MATCH",
                      "HAS_BG_CHECK_TOPICS",
                      "NOT_HAS_BG_CHECK_TOPICS",
                      "HAS_ANY_BG_CHECK_TOPICS",
                      "NOT_HAS_ANY_BG_CHECK_TOPICS",
                      "IS_EXPIRED",
                      "EXPIRES_IN",
                      "HAS_EXPIRY",
                      "NOT_HAS_EXPIRY",
                      "HAS_PENDING_REVIEW",
                      "NOT_HAS_PENDING_REVIEW",
                    ],
                  }),
                });
                t.nullable.json("value");
                t.nullable.field("logicalOperator", {
                  type: enumType({
                    name: "ProfileFieldValuesFilterGroupLogicalOperator",
                    members: ["AND", "OR"],
                  }),
                });
                t.nullable.list.nonNull.field("conditions", { type: "ProfileFieldValuesFilter" });
              },
            }),
          });
        },
      }),
    },
    resolve: async (_, { limit, offset, search, sortBy, filter }, ctx, info) => {
      let profileTypeFieldsById: Record<number, ProfileTypeField> | undefined = undefined;
      try {
        if (isNonNullish(filter?.values)) {
          assert(
            isNonNullish(filter.profileTypeId) && filter.profileTypeId.length === 1,
            "Must filter by a single profileTypeId when filtering by values",
          );
          const profileTypeFields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(
            filter.profileTypeId[0],
          );
          profileTypeFieldsById = indexBy(profileTypeFields, (ptf) => ptf.id);
          validateProfileFieldValuesFilter(filter?.values, profileTypeFieldsById);
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("Assertion Error: ")) {
          throw new ArgValidationError(
            info,
            "filter.values",
            e.message.slice("Assertion Error: ".length),
          );
        } else {
          throw e;
        }
      }

      return ctx.profiles.getPaginatedProfileForOrg(
        ctx.user!.org_id,
        {
          limit,
          offset,
          search,
          filter: filter as any,
          sortBy: sortBy?.map((value) => {
            const [field, order] = parseSortBy(value);
            return { field, order };
          }),
        },
        profileTypeFieldsById,
      );
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

export const profileRelationshipTypes = queryField("profileRelationshipTypes", {
  type: nonNull(list(nonNull("ProfileRelationshipType"))),
  authorize: authenticateAnd(userHasFeatureFlag("PROFILES")),
  resolve: async (_, args, ctx) => {
    return await ctx.profiles.loadProfileRelationshipTypesByOrgId(ctx.user!.org_id);
  },
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

export const profilesWithSameContent = queryField("profilesWithSameContent", {
  type: nonNull(
    list(
      nonNull(
        objectType({
          name: "ProfilesWithContent",
          definition(t) {
            t.nonNull.jsonObject("content", {
              resolve: (root, _, ctx) => ctx.profilesHelper.mapValueContentFromDatabase(root),
            });
            t.nonNull.list.nonNull.field("profiles", { type: "Profile" });
          },
        }),
      ),
    ),
  ),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILES:LIST_PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
    profileTypeFieldBelongsToProfileType("profileTypeFieldId", "profileTypeId"),
    profileTypeFieldIsOfType("profileTypeFieldId", ["SHORT_TEXT"]),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
  },
  resolve: async (_, { profileTypeFieldId }, ctx) => {
    const results = await ctx.profiles.findProfileFieldValuesWithSameContent(profileTypeFieldId);

    return await pMap(results, async (result) => {
      const profiles = await ctx.profiles.loadProfile(result.ids);
      assert(profiles.every(isNonNullish), "No profile should be null");
      return {
        content: { value: result.value },
        profiles: profiles,
      };
    });
  },
});
