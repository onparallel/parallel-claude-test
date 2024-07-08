import { list, nonNull, queryField, stringArg } from "nexus";
import { authenticate, authenticateAnd, chain } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { userHasAccessToUserGroups } from "./authorizers";

export const userGroupsQuery = queryField((t) => {
  t.paginationField("userGroups", {
    type: "UserGroup",
    description: "Paginated list of user groups in the organization",
    authorize: authenticateAnd(userHasAccessToUserGroups("excludeIds")),
    searchable: true,
    sortableBy: ["name", "createdAt"],
    extendArgs: {
      excludeIds: list(nonNull(globalIdArg())),
      type: list(nonNull("UserGroupType")),
    },
    resolve: (_, { offset, limit, sortBy, search, excludeIds, type }, ctx) => {
      const columnMap = {
        createdAt: "created_at",
        name: "name",
      } as const;
      return ctx.userGroups.getPaginatedUserGroupsForOrg(ctx.user!.org_id, {
        offset,
        limit,
        search,
        excludeIds,
        type,
        sortBy: sortBy?.map((value) => {
          const [field, order] = parseSortBy(value);
          return { field: columnMap[field], order };
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

/** @deprecated use paginated userGroups query */
export const searchUserGroups = queryField("searchUserGroups", {
  type: list("UserGroup"),
  description: "Search user groups",
  deprecation: "use paginated userGroups query instead",
  authorize: authenticateAnd(userHasAccessToUserGroups("excludeUserGroups")),
  args: {
    search: nonNull(stringArg()),
    excludeUserGroups: list(nonNull(globalIdArg("UserGroup"))),
    type: list(nonNull("UserGroupType")),
  },
  resolve: async (_, { search, excludeUserGroups, type }, ctx) => {
    return await ctx.userGroups.searchUserGroups(ctx.user!.org_id, search, {
      excludeUserGroups: excludeUserGroups ?? [],
      type,
    });
  },
});
