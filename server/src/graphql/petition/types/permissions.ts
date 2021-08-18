import { enumType, interfaceType, objectType } from "@nexus/schema";
import { isDefined } from "remeda";

export const PetitionPermissionTypeRW = enumType({
  name: "PetitionPermissionTypeRW",
  description: "The READ and WRITE permissions for a petition user.",
  members: ["READ", "WRITE"],
});

export const PetitionPermissionType = enumType({
  name: "PetitionPermissionType",
  description: "The type of permission for a petition user.",
  members: ["OWNER", "READ", "WRITE"],
});

export const PetitionPermission = interfaceType({
  name: "PetitionPermission",
  rootTyping: "db.PetitionPermission",
  resolveType: (o) => {
    if (isDefined(o.user_id)) {
      return "PetitionUserPermission";
    } else if (isDefined(o.user_group_id)) {
      return "PetitionUserGroupPermission";
    }
    throw new Error(
      `Either user_id or user_group_id must be defined on petition_permission with id ${o.id}`
    );
  },
  definition(t) {
    t.implements("Timestamps");
    t.field("petition", {
      type: "Petition",
      description: "The petition linked to the permission.",
      resolve: async (root, _, ctx) => {
        return (await ctx.petitions.loadPetition(root.petition_id))!;
      },
    });
    t.field("permissionType", {
      type: "PetitionPermissionType",
      description: "The type of the permission.",
      resolve: (o) => o.type,
    });
    t.boolean("isSubscribed", {
      description: "wether user is subscribed or not to emails and alerts of the petition",
      resolve: (o) => o.is_subscribed,
    });
  },
});

export const EffectivePetitionUserPermission = objectType({
  name: "EffectivePetitionUserPermission",
  rootTyping: `Pick<db.PetitionPermission, "petition_id" | "user_id" | "type" | "is_subscribed">`,
  description: "The effective permission for a petition and user",
  definition(t) {
    t.field("permissionType", {
      type: "PetitionPermissionType",
      description: "The type of the permission.",
      resolve: (o) => o.type,
    });
    t.boolean("isSubscribed", {
      description: "wether user is subscribed or not to emails and alerts of the petition",
      resolve: (o) => o.is_subscribed,
    });
  },
});

export const PetitionUserGroupPermission = objectType({
  name: "PetitionUserGroupPermission",
  rootTyping: "db.PetitionPermission",
  description: "The permission for a petition and user group",
  definition(t) {
    t.implements("PetitionPermission");
    t.field("group", {
      type: "UserGroup",
      description: "The group linked to the permission",
      resolve: async (root, _, ctx) => {
        return (await ctx.userGroups.loadUserGroup(root.user_group_id!))!;
      },
    });
  },
});

export const PetitionUserPermission = objectType({
  name: "PetitionUserPermission",
  rootTyping: "db.PetitionPermission",
  description: "The permission for a petition and user",
  definition(t) {
    t.implements("PetitionPermission");
    t.field("user", {
      type: "User",
      description: "The user linked to the permission",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.user_id!))!;
      },
    });
  },
});
