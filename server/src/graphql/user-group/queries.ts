import { queryField } from "@nexus/schema";
import { authenticate } from "../helpers/authorize";
import { parseSortBy } from "../helpers/paginationPlugin";

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
});
