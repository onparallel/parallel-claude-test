import { enumType, objectType } from "@nexus/schema";
import { toGlobalId } from "../../util/globalId";
import { hasOrgRole } from "../helpers/authorize";

export const OrganizationRole = enumType({
  name: "OrganizationRole",
  members: ["NORMAL", "ADMIN"],
  description: "The roles of a user within an organization.",
});

export const User = objectType({
  name: "User",
  description: "A user in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the user.",
      resolve: (o) => toGlobalId("User", o.id),
    });
    t.field("organizationRole", {
      type: "OrganizationRole",
      resolve: (o) => o.organization_role,
    });
    t.string("email", {
      description: "The email of the user.",
    });
    t.string("firstName", {
      description: "The first name of the user.",
      nullable: true,
      resolve: (o) => o.first_name,
    });
    t.string("lastName", {
      description: "The last name of the user.",
      nullable: true,
      resolve: (o) => o.last_name,
    });
    t.string("fullName", {
      description: "The full name of the user.",
      nullable: true,
      resolve: (o) => {
        if (o.first_name) {
          return o.last_name ? `${o.first_name} ${o.last_name}` : o.first_name;
        } else {
          return null;
        }
      },
    });
    t.field("organization", {
      type: "Organization",
      resolve: async (o, _, ctx) => {
        return (await ctx.organizations.loadOrg(o.org_id))!;
      },
    });
    t.jsonObject("onboardingStatus", {
      authorize: hasOrgRole("ADMIN"),
      description: "The onboarding status for the different views of the app.",
      resolve: (o) => o.onboarding_status,
    });
  },
});
