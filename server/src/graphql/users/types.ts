import { arg, enumType, list, nonNull, objectType } from "@nexus/schema";
import { rootIsContextUser } from "./authorizers";
import { fullName } from "../../util/fullName";

export const OrganizationRole = enumType({
  name: "OrganizationRole",
  members: ["NORMAL", "ADMIN"],
  description: "The roles of a user within an organization.",
});

export const FeatureFlag = enumType({
  name: "FeatureFlag",
  members: [
    "PETITION_SIGNATURE",
    "INTERNAL_COMMENTS",
    "PETITION_PDF_EXPORT",
    {
      name: "HIDE_RECIPIENT_VIEW_CONTENTS",
      deprecation: "Don't use this",
    },
    "SKIP_FORWARD_SECURITY",
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
    t.field("authenticationTokens", {
      description: "Lists every auth token of the user",
      type: list(nonNull("UserAuthenticationToken")),
      authorize: rootIsContextUser(),
      resolve: async (root, _, ctx) => {
        return await ctx.userAuthentication.loadUserAuthenticationTokens(
          root.id
        );
      },
    });
  },
});
