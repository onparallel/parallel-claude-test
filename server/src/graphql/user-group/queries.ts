import { list, nonNull, queryField, stringArg } from "nexus";
import { authenticate, authenticateAnd, chain, ifArgDefined } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { userHasAccessToUserGroups } from "./authorizers";

export const userGroupsQuery = queryField((t) => {
  t.paginationField("userGroups", {
    type: "UserGroup",
    description: "Paginated list of user groups in the organization",
    authorize: authenticate(),
    searchable: true,
    sortableBy: ["name", "createdAt"],
    resolve: async (_, { offset, limit, sortBy, search }, ctx) => {
      const columnMap = {
        createdAt: "created_at",
        name: "name",
      } as const;
      return ctx.userGroups.loadUserGroupsForOrg(ctx.user!.org_id, {
        offset,
        limit,
        search,
        sortBy: sortBy?.map((value) => {
          const [field, order] = parseSortBy(value);
          return { column: columnMap[field], order };
        }),
      });
    },
  });

  t.nullable.field("userGroup", {
    type: "UserGroup",
    args: {
      id: nonNull(globalIdArg()),
    },
    authorize: chain(authenticate(), userHasAccessToUserGroups("id")),
    resolve: async (root, args, ctx) => {
      return await ctx.userGroups.loadUserGroup(args.id);
    },
  });
});

export const searchUserGroups = queryField("searchUserGroups", {
  type: list("UserGroup"),
  description: "Search user groups",
  authorize: authenticateAnd(
    ifArgDefined("excludeUserGroups", userHasAccessToUserGroups("excludeUserGroups" as never))
  ),
  args: {
    search: nonNull(stringArg()),
    excludeUserGroups: list(nonNull(globalIdArg("UserGroup"))),
  },
  resolve: async (_, { search, excludeUserGroups }, ctx) => {
    return await ctx.userGroups.searchUserGroups(ctx.user!.org_id, search, {
      excludeUserGroups: excludeUserGroups ?? [],
    });
  },
});
