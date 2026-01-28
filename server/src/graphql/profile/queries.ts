import { arg, inputObjectType, list, nonNull, nullable, objectType, queryField } from "nexus";
import pMap from "p-map";
import { indexBy, isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { mapAndValidateProfileQueryFilter } from "../../util/ProfileQueryFilter";
import { mapAndValidateProfileQuerySortBy } from "../../util/ProfileQuerySortBy";
import { authenticate, authenticateAnd, ifArgDefined, not } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { validateAnd } from "../helpers/validateArgs";
import { userHasFeatureFlag } from "../petition/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import {
  profileTypeFieldBelongsToProfileType,
  profileTypeFieldIsOfType,
  userHasAccessToProfile,
  userHasAccessToProfileType,
  userHasPermissionOnProfileTypeField,
} from "./authorizers";
import { validProfileQueryFilter, validProfileQuerySortBy } from "./validators";

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
    extendArgs: {
      profileTypeId: nonNull(globalIdArg("ProfileType")),
      filter: nullable("ProfileQueryFilterInput"),
      sortBy: nullable(list(nonNull("String"))),
    },
    validateArgs: validateAnd(
      validProfileQueryFilter("profileTypeId", "filter"),
      validProfileQuerySortBy("profileTypeId", "sortBy"),
    ),
    resolve: async (_, { limit, offset, search, sortBy, profileTypeId, filter }, ctx) => {
      const profileTypeFields =
        await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
      const profileTypeFieldsById = indexBy(profileTypeFields, (ptf) => ptf.id);

      return ctx.profiles.getPaginatedProfileForOrg(
        ctx.user!.org_id,
        {
          limit,
          offset,
          search,
          profileTypeId: [profileTypeId],
          filter: mapAndValidateProfileQueryFilter(filter, profileTypeFieldsById),
          sortBy: mapAndValidateProfileQuerySortBy(sortBy, profileTypeFieldsById),
        },
        profileTypeFieldsById,
      );
    },
  });
  t.paginationField("profilesSimple", {
    type: "Profile",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      contextUserHasPermission("PROFILES:LIST_PROFILES"),
    ),
    searchable: true,
    extendArgs: {
      profileTypeId: nullable(list(nonNull(globalIdArg("ProfileType")))),
      status: nullable(list(nonNull("ProfileStatus"))),
    },
    resolve: async (_, { limit, offset, search, profileTypeId, status }, ctx) => {
      // passing an empty array means the user filtered out every profile type from the query, so we return an empty list
      if (isNonNullish(profileTypeId) && profileTypeId.length === 0) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      return ctx.profiles.getPaginatedProfileForOrg(ctx.user!.org_id, {
        limit,
        offset,
        search,
        profileTypeId,
        filter: status
          ? {
              property: "status",
              operator: "IS_ONE_OF",
              value: status,
            }
          : null,
        sortBy: [{ field: "name", order: "asc" }],
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
              resolve: async (root, _, ctx) =>
                await ctx.profilesHelper.mapValueContentFromDatabase(root),
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

export const profileTypeFieldValueHistory = queryField((t) => {
  t.paginationField("profileTypeFieldValueHistory", {
    type: "ProfileFieldValue",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      userHasAccessToProfile("profileId"),
      userHasPermissionOnProfileTypeField("profileTypeFieldId", "READ"),
      not(profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"])),
    ),
    extendArgs: {
      profileId: nonNull(globalIdArg("Profile")),
      profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    },
    resolve: async (_, args, ctx) => {
      return ctx.profiles.getPaginatedHistoryForProfileTypeFieldValue(
        args.profileId,
        args.profileTypeFieldId,
        {
          limit: args.limit,
          offset: args.offset,
        },
      );
    },
  });
});

export const profileTypeFieldFileHistory = queryField((t) => {
  t.paginationField("profileTypeFieldFileHistory", {
    type: objectType({
      name: "ProfileTypeFieldFileHistory",
      definition(t) {
        t.nonNull.string("eventType", {
          resolve: (o) => (o.event_type === "PROFILE_FIELD_FILE_ADDED" ? "ADDED" : "REMOVED"),
        });
        t.nonNull.field("profileFieldFile", {
          type: "ProfileFieldFile",
          resolve: async (o, _, ctx) => {
            return await ctx.profiles.loadProfileFieldFileById(o.id);
          },
        });
      },
      sourceType: /* ts */ `db.ProfileFieldFile & {
        event_type: "PROFILE_FIELD_FILE_ADDED" | "PROFILE_FIELD_FILE_REMOVED";
      }`,
    }),
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      userHasAccessToProfile("profileId"),
      userHasPermissionOnProfileTypeField("profileTypeFieldId", "READ"),
      profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"]),
    ),
    extendArgs: {
      profileId: nonNull(globalIdArg("Profile")),
      profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    },
    resolve: async (_, args, ctx) => {
      return ctx.profiles.getPaginatedHistoryForProfileTypeFieldFile(
        args.profileId,
        args.profileTypeFieldId,
        {
          limit: args.limit,
          offset: args.offset,
        },
      );
    },
  });
});
