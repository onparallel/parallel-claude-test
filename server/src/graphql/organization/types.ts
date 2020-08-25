import { enumType, idArg, objectType } from "@nexus/schema";
import { fromGlobalIds } from "../../util/globalId";
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
    });
    t.field("status", {
      type: "OrganizationStatus",
      description: "The status of the organization.",
    });
    t.paginationField("users", {
      type: "User",
      description: "The users in the organization.",
      searchable: true,
      authorize: belongsToOrg(),
      additionalArgs: {
        exclude: globalIdArg({
          list: [true],
          required: false,
        }),
      },
      resolve: async (root, { offset, limit, search, exclude }, ctx) => {
        const { ids: excludeIds } = fromGlobalIds(exclude ?? [], "User");
        return await ctx.organizations.loadOrgUsers(root.id, {
          offset,
          limit,
          search,
          excludeIds,
        });
      },
    });
  },
});
