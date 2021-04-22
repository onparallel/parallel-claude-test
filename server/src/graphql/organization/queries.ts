import { arg, nonNull, nullable, queryField } from "@nexus/schema";
import {
  authenticate,
  chain,
  or,
  userIsSuperAdmin,
} from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { contextUserBelongsToOrg } from "./authorizers";

export const organizationQueries = queryField((t) => {
  t.nullable.field("organization", {
    type: "Organization",
    args: {
      id: nonNull(globalIdArg()),
    },
    authorize: chain(
      authenticate(),
      or(contextUserBelongsToOrg("id"), userIsSuperAdmin())
    ),
    resolve: async (_, args, ctx) => {
      return await ctx.organizations.loadOrg(args.id);
    },
  });

  t.paginationField("organizations", {
    type: "Organization",
    description: "The organizations registered in Parallel.",
    authorize: chain(authenticate(), userIsSuperAdmin()),
    searchable: true,
    sortableBy: ["name", "createdAt"],
    additionalArgs: {
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
