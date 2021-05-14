import { objectType } from "@nexus/schema";

export const UserGroup = objectType({
  name: "UserGroup",
  definition(t) {
    t.globalId("id", { prefixName: "UserGroup" });
    t.string("name");
    t.list.field("members", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return await ctx.userGroups.loadMembersForUserGroup(root.id);
      },
    });
    t.implements("Timestamps");
  },
});
