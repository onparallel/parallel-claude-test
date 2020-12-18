import { queryField } from "@nexus/schema";
import { authenticate, chain } from "../helpers/authorize";
import { parseSortBy } from "../helpers/paginationPlugin";
import { contextUserIsOrgAdmin } from "../users/authorizers";

export const userQueries = queryField((t) => {
  t.field("me", {
    type: "User",
    authorize: authenticate(),
    resolve: (_, args, ctx) => {
      return ctx.user!;
    },
  });

  t.paginationField("organizationUsers", {
    type: "User",
    description: "The users of an organization",
    authorize: chain(authenticate(), contextUserIsOrgAdmin()),
    searchable: true,
    sortableBy: ["firstName", "lastName", "email", "createdAt"],
    resolve: async (_, { search, offset, limit, sortBy }, ctx) => {
      const columnMap = {
        firstName: "first_name",
        lastName: "last_name",
        email: "email",
        createdAt: "created_at",
      } as const;
      return await ctx.organizations.loadOrgUsers(ctx.user!.org_id, {
        search,
        offset,
        limit,
        sortBy: (sortBy || ["createdAt_ASC"]).map((value) => {
          const [field, order] = parseSortBy(value);
          return { column: columnMap[field], order };
        }),
      });
    },
  });
});
