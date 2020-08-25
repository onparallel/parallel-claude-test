import { enumType, objectType } from "@nexus/schema";

export const PetitionUserPermissionTypeRW = enumType({
  name: "PetitionUserPermissionTypeRW",
  description: "The READ and WRITE permissions for a petition user.",
  members: ["READ", "WRITE"],
});

export const PetitionUserPermissionType = enumType({
  name: "PetitionUserPermissionType",
  description: "The type of permission for a petition user.",
  members: ["OWNER", "READ", "WRITE"],
});

export const PetitionUserPermission = objectType({
  name: "PetitionUserPermission",
  rootTyping: "db.PetitionUser",
  description: "The permission for a petition and user",
  definition(t) {
    t.implements("Timestamps");
    t.globalId("id");
    t.field("user", {
      type: "User",
      description: "The user linked to the permission",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.user_id))!;
      },
    });
    t.field("petition", {
      type: "Petition",
      description: "The petition linked to the permission.",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetition(root.petition_id))!;
      },
    });
    t.field("permissionType", {
      type: "PetitionUserPermissionType",
      description: "The type of the permission.",
      resolve: (o) => o.permission_type,
    });
    t.boolean("isSubscribed", {
      description:
        "wether user is subscribed or not to emails and alerts of the petition",
      resolve: (o) => o.is_subscribed,
    });
  },
});
