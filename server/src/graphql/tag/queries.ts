import { queryField } from "@nexus/schema";
import { authenticate } from "../helpers/authorize";
import Fuse from "fuse.js";

export const tagsQuery = queryField((t) => {
  t.paginationField("tags", {
    type: "Tag",
    description: "Tags of the user organization",
    authorize: authenticate(),
    searchable: true,
    resolve: async (_, args, ctx) => {
      let items = await ctx.tags.loadTagsByOrganizationId(ctx.user!.org_id);

      if (args.search) {
        const fuse = new Fuse(items, { keys: ["name"] });
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
});
