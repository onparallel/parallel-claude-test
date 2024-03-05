import Fuse from "fuse.js";
import { list, nonNull, queryField, stringArg } from "nexus";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToTags } from "./authorizers";

export const tagsQuery = queryField((t) => {
  t.paginationField("tags", {
    type: "Tag",
    description: "Paginated list of tags in the organization",
    authorize: authenticateAnd(userHasAccessToTags("tagIds")),
    searchable: true,
    extendArgs: {
      tagIds: list(nonNull(globalIdArg("Tag"))),
    },
    resolve: async (_, args, ctx) => {
      let items = await ctx.tags.loadTagsByOrganizationId(ctx.user!.org_id);

      if (args.search) {
        const fuse = new Fuse(items, {
          keys: ["name"],
          threshold: 0.4,
          shouldSort: false,
        });
        items = fuse.search(args.search).map((r) => r.item);
      }

      const offset = args.offset ?? 0;
      const limit = args.limit ?? items.length;

      return {
        items: items.slice(offset, offset + limit),
        totalCount: items.length,
      };
    },
  });

  t.paginationField("tagsByName", {
    description:
      "Paginated list of tags in the organization where tag name is included in the search argument.",
    type: "Tag",
    authorize: authenticate(),
    extendArgs: {
      search: nonNull(list(nonNull(stringArg()))),
    },
    resolve: async (_, args, ctx) => {
      const items = await ctx.tags.getOrganizationTagsFilteredByName(ctx.user!.org_id, args.search);

      const offset = args.offset ?? 0;
      const limit = args.limit ?? items.length;

      return {
        items: items.slice(offset, offset + limit),
        totalCount: items.length,
      };
    },
  });
});
