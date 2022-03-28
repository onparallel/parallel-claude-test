import { arg, enumType, list, nonNull, objectType, unionType } from "nexus";
import { omit } from "remeda";
import {
  FeatureFlagNameValues,
  UserOrganizationRoleValues,
  UserStatusValues,
} from "../../db/__types";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { getInitials } from "../../util/initials";
import { userHasRole } from "../../util/userHasRole";
import { datetimeArg } from "../helpers/date";
import { rootIsContextUser } from "./authorizers";

export const OrganizationRole = enumType({
  name: "OrganizationRole",
  members: UserOrganizationRoleValues,
  description: "The roles of a user within an organization.",
});

export const FeatureFlag = enumType({
  name: "FeatureFlag",
  members: FeatureFlagNameValues,
  sourceType: "db.FeatureFlagName",
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
    t.field("role", {
      type: "OrganizationRole",
      resolve: (o) => o.organization_role,
    });
    t.boolean("isSuperAdmin", {
      resolve: async (o, _, ctx) => {
        const org = await ctx.organizations.loadOrg(o.org_id);
        return org?.status === "ROOT" && userHasRole(o, "ADMIN");
      },
    });
    t.boolean("canCreateUsers", {
      resolve: async (o, _, ctx) => {
        const ssoIntegrations = await ctx.integrations.loadIntegrationsByOrgId(o.org_id, "SSO");
        const hasSsoProvider = ssoIntegrations.length > 0;
        return userHasRole(o, "ADMIN") && !hasSsoProvider;
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
    t.field("unreadNotificationIds", {
      authorize: rootIsContextUser(),
      type: list("ID"),
      resolve: async ({ id }, _, ctx) => {
        const notifications = await ctx.petitions.loadUnreadPetitionUserNotificationsByUserId(id);
        return notifications.map((n) => toGlobalId("PetitionUserNotification", n.id));
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
      resolve: async (o, _, ctx) => {
        return await ctx.users.loadAvatarUrlByUserDataId(o.user_data_id);
      },
    });
    t.nullable.string("preferredLocale", {
      resolve: async (o, _, ctx) => {
        const userData = await ctx.users.loadUserData(o.user_data_id);
        return userData!.details?.preferredLocale ?? null;
      },
    });
    t.list.field("userGroups", {
      type: "UserGroup",
      resolve: async (root, _, ctx) => {
        return await ctx.userGroups.loadUserGroupsByUserId(root.id);
      },
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
