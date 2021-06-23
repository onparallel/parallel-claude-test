import {
  arg,
  enumType,
  list,
  nonNull,
  objectType,
  unionType,
} from "@nexus/schema";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { parseSortBy } from "../helpers/paginationPlugin";
import { rootIsContextUser } from "./authorizers";

export const OrganizationRole = enumType({
  name: "OrganizationRole",
  members: ["NORMAL", "ADMIN"],
  description: "The roles of a user within an organization.",
});

export const FeatureFlag = enumType({
  name: "FeatureFlag",
  members: [
    "API_TOKENS",
    "PETITION_SIGNATURE",
    "INTERNAL_COMMENTS",
    "PETITION_PDF_EXPORT",
    {
      name: "HIDE_RECIPIENT_VIEW_CONTENTS",
      deprecation: "Don't use this",
    },
    "SKIP_FORWARD_SECURITY",
    "EXPORT_CUATRECASAS",
  ],
  rootTyping: "db.FeatureFlagName",
});

export const UserStatus = enumType({
  name: "UserStatus",
  members: ["ACTIVE", "INACTIVE"],
  rootTyping: "db.UserStatus",
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
        return (
          org?.identifier === "parallel" && o.organization_role === "ADMIN"
        );
      },
    });
    t.boolean("isSsoUser", {
      resolve: (o) => o.is_sso_user,
    });
    t.string("email", {
      description: "The email of the user.",
    });
    t.nullable.string("firstName", {
      description: "The first name of the user.",
      resolve: (o) => o.first_name,
    });
    t.nullable.string("lastName", {
      description: "The last name of the user.",
      resolve: (o) => o.last_name,
    });
    t.nullable.string("fullName", {
      description: "The full name of the user.",
      resolve: (o) => fullName(o.first_name, o.last_name),
    });
    t.field("organization", {
      type: "Organization",
      resolve: async (o, _, ctx) => {
        return (await ctx.organizations.loadOrg(o.org_id))!;
      },
    });
    t.jsonObject("onboardingStatus", {
      authorize: rootIsContextUser(),
      description: "The onboarding status for the different views of the app.",
      resolve: (o) => o.onboarding_status,
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
    t.paginationField("authenticationTokens", {
      authorize: rootIsContextUser(),
      description: "Lists every auth token of the user",
      type: "UserAuthenticationToken",
      searchable: true,
      sortableBy: ["createdAt", "tokenName", "lastUsedAt"],
      resolve: async (root, { offset, limit, search, sortBy }, ctx) => {
        const columnMap = {
          tokenName: "token_name",
          createdAt: "created_at",
          lastUsedAt: "last_used_at",
        } as const;
        return await ctx.userAuthentication.loadUserAuthenticationTokens(
          root.id,
          {
            offset,
            limit,
            search,
            sortBy: sortBy?.map((value) => {
              const [field, order] = parseSortBy(value);
              return { column: columnMap[field], order };
            }),
          }
        );
      },
    });
    t.field("unreadNotificationIds", {
      authorize: rootIsContextUser(),
      type: nonNull(list(nonNull("String"))),
      resolve: async ({ id }, _, ctx) => {
        const notifications =
          await ctx.petitions.loadUnreadPetitionUserNotificationsByUserId(id);
        return notifications.map((n) =>
          toGlobalId("PetitionUserNotification", n.id)
        );
      },
    });
    t.paginationField("notifications", {
      authorize: rootIsContextUser(),
      description:
        "Read and unread user notifications about events on their petitions",
      type: "PetitionUserNotification",
      additionalArgs: {
        filter: arg({ type: "PetitionUserNotificationFilter" }),
      },
      resolve: async (_, { limit, offset, filter }, ctx) => {
        return await ctx.petitions.loadPetitionUserNotificationsByUserId(
          ctx.user!.id,
          { limit, offset },
          filter
        );
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
  rootTyping: /* ts */ `
    | ({__type: "User"} & NexusGenRootTypes["User"])
    | ({__type: "UserGroup"} & NexusGenRootTypes["UserGroup"])
  `,
});
