import { arg, enumType, nonNull, objectType, unionType } from "nexus";
import { indexBy, isDefined, omit, sortBy, uniq } from "remeda";
import { FeatureFlagNameValues, UserLocaleValues, UserStatusValues } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { getInitials } from "../../util/initials";
import { datetimeArg } from "../helpers/scalars/DateTime";
import { rootIsContextRealUser, rootIsContextUser } from "./authorizers";

export const UserLocale = enumType({
  name: "UserLocale",
  members: UserLocaleValues,
  description: "The preferred locale for the user",
  sourceType: "db.UserLocale",
});

export const FeatureFlag = enumType({
  name: "FeatureFlag",
  members: FeatureFlagNameValues,
  sourceType: "db.FeatureFlagName",
});

export const FeatureFlagNameValue = objectType({
  name: "FeatureFlagNameValue",
  description: "A feature flag name with his value",
  definition(t) {
    t.nonNull.field("name", { type: "FeatureFlag" });
    t.nonNull.boolean("value");
  },
});

export const UserStatus = enumType({
  name: "UserStatus",
  members: UserStatusValues,
  sourceType: "db.UserStatus",
});

export const User = objectType({
  name: "User",
  description: "A user in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.globalId("id", {
      description: "The ID of the user.",
    });
    t.boolean("isMe", {
      resolve: (o, _, ctx) => o.id === ctx.user!.id,
    });
    t.list.string("permissions", {
      authorize: rootIsContextUser(),
      resolve: async (o, _, ctx) => {
        return await ctx.users.loadUserPermissions(o.id);
      },
    });
    t.boolean("isSuperAdmin", {
      resolve: async (o, _, ctx) => {
        const [org, permissions] = await Promise.all([
          ctx.organizations.loadOrg(o.org_id),
          ctx.users.loadUserPermissions(o.id),
        ]);

        return org?.status === "ROOT" && permissions.includes("SUPERADMIN");
      },
    });
    t.boolean("canCreateUsers", {
      resolve: async (o, _, ctx) => {
        const ssoIntegrations = await ctx.integrations.loadIntegrationsByOrgId(o.org_id, "SSO");
        const userPermissions = await ctx.users.loadUserPermissions(o.id);
        const hasSsoProvider = ssoIntegrations.length > 0;
        return !hasSsoProvider && userPermissions.includes("USERS:CRUD_USERS");
      },
    });
    t.boolean("isSsoUser", {
      resolve: async (o, _, ctx) => {
        const userData = await ctx.users.loadUserData(o.user_data_id);
        return userData!.is_sso_user ?? false;
      },
    });
    t.string("email", {
      description: "The email of the user.",
      resolve: async (o, _, ctx) => {
        const userData = await ctx.users.loadUserData(o.user_data_id);
        return userData!.email;
      },
    });
    t.nullable.string("firstName", {
      description: "The first name of the user.",
      resolve: async (o, _, ctx) => {
        const userData = await ctx.users.loadUserData(o.user_data_id);
        return userData!.first_name;
      },
    });
    t.nullable.string("lastName", {
      description: "The last name of the user.",
      resolve: async (o, _, ctx) => {
        const userData = await ctx.users.loadUserData(o.user_data_id);
        return userData!.last_name;
      },
    });
    t.nullable.string("fullName", {
      description: "The full name of the user.",
      resolve: async (o, _, ctx) => {
        const userData = await ctx.users.loadUserData(o.user_data_id);
        return fullName(userData!.first_name, userData!.last_name);
      },
    });
    t.nullable.string("initials", {
      description: "The initials of the user.",
      resolve: async (o, _, ctx) => {
        const userData = (await ctx.users.loadUserData(o.user_data_id))!;
        return getInitials(fullName(userData!.first_name, userData!.last_name));
      },
    });
    t.field("organization", {
      type: "Organization",
      resolve: async (o, _, ctx) => {
        return (await ctx.organizations.loadOrg(o.org_id))!;
      },
    });
    t.boolean("hasFeatureFlag", {
      authorize: rootIsContextUser(),
      args: {
        featureFlag: nonNull(arg({ type: "FeatureFlag" })),
      },
      resolve: async (root, { featureFlag }, ctx) => {
        return ctx.featureFlags.userHasFeatureFlag(root.id, featureFlag);
      },
    });
    t.nullable.datetime("lastActiveAt", {
      resolve: (o) => o.last_active_at,
    });
    t.field("status", {
      type: "UserStatus",
      resolve: (o) => o.status,
    });
    t.nonNull.list.nonNull.field("tokens", {
      type: "UserAuthenticationToken",
      authorize: rootIsContextUser(),
      description: "Lists the API tokens this user has.",
      resolve: async (root, _, ctx) => {
        return await ctx.userAuthentication.loadUserAuthenticationTokens(root.id);
      },
    });
    t.list.globalId("unreadNotificationIds", {
      prefixName: "PetitionUserNotification",
      authorize: rootIsContextUser(),
      resolve: async (o, _, ctx) => {
        return await ctx.petitions.loadUnreadPetitionUserNotificationsIdsByUserId(o.id);
      },
    });
    t.paginationField("notifications", {
      authorize: rootIsContextUser(),
      description: "Read and unread user notifications about events on their petitions",
      type: "PetitionUserNotification",
      hasTotalCount: false,
      extendArgs: (args) => ({
        ...omit(args, ["offset"]),
        filter: arg({ type: "PetitionUserNotificationFilter" }),
        before: datetimeArg({
          description: "Return notifications after the specified date.",
        }),
      }),
      extendPagination(t) {
        t.boolean("hasMore", {
          description: "Whether this resource has more items.",
        });
      },
      resolve: async (_, { limit, filter, before }, ctx) => {
        const _limit = limit ?? 0;
        const items = await ctx.petitions.loadPetitionUserNotificationsByUserId(ctx.user!.id, {
          limit: _limit + 1,
          filter,
          before,
        });
        return {
          items: items.length > _limit ? items.slice(0, -1) : items,
          hasMore: items.length > _limit,
        };
      },
    });
    t.nullable.string("avatarUrl", {
      description: "URL to the user avatar",
      args: {
        options: arg({ type: "ImageOptions" }),
      },
      resolve: async (root, args, ctx) => {
        const path = await ctx.users.loadAvatarPathByUserDataId(root.user_data_id);
        return isDefined(path) ? await ctx.images.getImageUrl(path, args.options as any) : null;
      },
    });
    t.field("preferredLocale", {
      type: "UserLocale",
      resolve: async (o, _, ctx) => {
        const userData = await ctx.users.loadUserData(o.user_data_id);
        return userData!.preferred_locale;
      },
    });
    t.list.field("userGroups", {
      type: "UserGroup",
      resolve: async (root, _, ctx) => {
        return await ctx.userGroups.loadUserGroupsByUserId(root.id);
      },
    });
    t.list.field("delegates", {
      type: "User",
      description: "Users that the user allows to send on their behalf",
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadUserDelegatesByUserId(root.id);
      },
    });
    t.list.field("delegateOf", {
      type: "User",
      description: "Users that the user can send on behalf of",
      resolve: async (root, _, ctx) => {
        return await ctx.users.loadReverseUserDelegatesByUserId(root.id);
      },
    });
    t.list.field("organizations", {
      type: "Organization",
      description: "Organizations this user belongs to",
      authorize: rootIsContextRealUser(),
      resolve: async (root, _, ctx) => {
        const users = (await ctx.users.loadUsersByUserDataId(root.user_data_id)).filter(
          (user) => user.status === "ACTIVE",
        );
        const usersByOrgId = indexBy(users, (u) => u.org_id);
        const orgs = await ctx.organizations.loadOrg(uniq(users.map((u) => u.org_id)));
        return sortBy(orgs.filter(isDefined), (o) => usersByOrgId[o.id].created_at);
      },
    });
    t.list.field("petitionListViews", {
      type: "PetitionListView",
      description: "The petition views of the user",
      authorize: rootIsContextUser(),
      resolve: async (root, _, ctx) => {
        return await ctx.views.loadPetitionListViewsByUserId(root.id);
      },
    });
    t.boolean("isOrgOwner", {
      resolve: (o) => o.is_org_owner,
    });
  },
});

export const UserOrUserGroup = unionType({
  name: "UserOrUserGroup",
  definition(t) {
    t.members("User", "UserGroup");
  },
  resolveType: (o) => {
    if (["User", "UserGroup"].includes(o.__type)) {
      return o.__type;
    }
    throw new Error("Missing __type on UserOrUserGroup");
  },
  sourceType: /* ts */ `
    | ({__type: "User"} & NexusGenRootTypes["User"])
    | ({__type: "UserGroup"} & NexusGenRootTypes["UserGroup"])
  `,
});
