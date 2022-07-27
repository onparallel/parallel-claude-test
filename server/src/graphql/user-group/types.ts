import { objectType } from "nexus";
import { getInitials } from "../../util/initials";

export const UserGroup = objectType({
  name: "UserGroup",
  definition(t) {
    t.globalId("id", { prefixName: "UserGroup" });
    t.string("name");
    t.string("initials", {
      resolve: (o) => getInitials(o.name, { removeAffixes: false }),
    });
    t.boolean("imMember", {
      resolve: async (root, _, ctx) => {
        return await ctx.userGroups.loadUsersBelongsToGroup({
          userGroupId: root.id,
          userIds: [ctx.user!.id],
        });
      },
    });
    t.list.field("members", {
      type: "UserGroupMember",
      resolve: async (root, _, ctx) => {
        return await ctx.userGroups.loadUserGroupMembers(root.id);
      },
    });
    t.int("memberCount", {
      resolve: async (root, _, ctx) => {
        return await ctx.userGroups.loadUserGroupCount(root.id);
      },
    });
    t.implements("Timestamps");
  },
});

export const UserGroupMember = objectType({
  name: "UserGroupMember",
  definition(t) {
    t.globalId("id", { prefixName: "UserGroupMember" });
    t.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.user_id))!;
      },
    });
    t.datetime("addedAt", {
      description: "The time the user was added to the user group.",
      resolve: (o) => o.created_at,
    });
  },
});
