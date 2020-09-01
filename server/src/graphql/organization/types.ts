import { enumType, objectType } from "@nexus/schema";
import { belongsToOrg } from "./authorizers";
import { globalIdArg } from "../helpers/globalIdPlugin";

export const OrganizationStatus = enumType({
  name: "OrganizationStatus",
  members: [
    { name: "DEV", description: "Used for development or testing purposes" },
    { name: "DEMO", description: "Used for demoing the product" },
    { name: "ACTIVE", description: "Used for regular clients" },
    { name: "CHURNED", description: "Used on churned clients" },
  ],
  description: "The status of the organization.",
});

export const Organization = objectType({
  name: "Organization",
  description: "An organization in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.globalId("id", {
      description: "The ID of the organization.",
    });
    t.string("name", {
      description: "The name of the organization.",
    });
    t.string("identifier", {
      description: "The unique text identifier of the organization.",
      authorize: belongsToOrg(),
    });
    t.field("status", {
      type: "OrganizationStatus",
      description: "The status of the organization.",
      authorize: belongsToOrg(),
    });
    t.paginationField("users", {
      type: "User",
      description: "The users in the organization.",
      searchable: true,
      authorize: belongsToOrg(),
      additionalArgs: {
        exclude: globalIdArg("User", {
          list: [true],
          required: false,
        }),
      },
      resolve: async (root, { offset, limit, search, exclude }, ctx) => {
        return await ctx.organizations.loadOrgUsers(root.id, {
          offset,
          limit,
          search,
          excludeIds: exclude,
        });
      },
    });
  },
});
