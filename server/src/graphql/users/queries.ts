import { queryField, idArg } from "@nexus/schema";
import { authenticate, chain } from "../helpers/authorize";
import { fromGlobalIds, fromGlobalId } from "../../util/globalId";
import { belongsToOrgInProp } from "../organization/authorizers";

export const userQueries = queryField((t) => {
  t.field("me", {
    type: "User",
    authorize: authenticate(),
    resolve: (_, args, ctx) => {
      return ctx.user!;
    },
  });

  t.paginationField("orgUsers", {
    type: "User",
    description: "The users of an organization",
    authorize: chain(authenticate(), belongsToOrgInProp("orgId")),
    searchable: true,
    additionalArgs: {
      orgId: idArg({
        required: true,
      }),
      exclude: idArg({
        list: [true],
        required: false,
      }),
    },
    resolve: async (_, { offset, limit, search, exclude, orgId }, ctx) => {
      const { ids: excludeIds } = fromGlobalIds(exclude ?? [], "User");
      const { id } = fromGlobalId(orgId, "Organization");
      return await ctx.users.loadUsersForOrganization(id, {
        search,
        excludeIds,
        offset,
        limit,
        sortBy: [
          { column: "last_name", order: "asc" },
          { column: "first_name", order: "asc" },
          { column: "email", order: "asc" },
        ],
      });
    },
  });
});
