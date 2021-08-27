import { arg, nonNull, nullable, queryField, stringArg } from "@nexus/schema";
import { authenticateAnd, or, userIsSuperAdmin } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { contextUserIsAdmin } from "../users/authorizers";
import { contextUserBelongsToOrg } from "./authorizers";

export const organizationQueries = queryField((t) => {
  t.nullable.field("organization", {
    type: "Organization",
    args: {
      id: nonNull(globalIdArg()),
    },
    authorize: authenticateAnd(or(contextUserBelongsToOrg("id"), userIsSuperAdmin())),
    resolve: async (_, args, ctx) => {
      return await ctx.organizations.loadOrg(args.id);
    },
  });

  t.field("organizationNameIsAvailable", {
    description:
      "Checks if the provided organization name is available to be registered on Parallel",
    type: "Boolean",
    args: {
      name: nonNull(stringArg()),
    },
    authorize: authenticateAnd(contextUserIsAdmin()),
    resolve: async (_, { name }, ctx) => {
      return !(await ctx.organizations.loadOrgByIdentifier(
        name.trim().toLowerCase().replace(/ /g, "-")
      ));
    },
  });

  t.paginationField("organizations", {
    type: "Organization",
    description: "The organizations registered in Parallel.",
    authorize: authenticateAnd(userIsSuperAdmin()),
    searchable: true,
    sortableBy: ["name", "createdAt"],
    extendArgs: {
      status: nullable(
        arg({
          type: "OrganizationStatus",
          description: "Optional status to filter for.",
        })
      ),
    },
    resolve: async (_, { offset, limit, search, status, sortBy }, ctx) => {
      const columnMap = {
        createdAt: "created_at",
        name: "name",
      } as const;
      return await ctx.organizations.loadOrganizations({
        search,
        offset,
        limit,
        status,
        sortBy: sortBy?.map((value) => {
          const [field, order] = parseSortBy(value);
          return { column: columnMap[field], order };
        }),
      });
    },
  });
});
