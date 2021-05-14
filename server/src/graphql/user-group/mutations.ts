import {
  inputObjectType,
  list,
  mutationField,
  nonNull,
  stringArg,
} from "@nexus/schema";
import { CreateTag } from "../../db/__types";
import { authenticateAnd } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyString } from "../helpers/validators/notEmptyString";
import { userHasAccessToUsers } from "../petition/mutations/authorizers";
import { contextUserIsAdmin } from "../users/authorizers";
import { userHasAccessToUserGroup } from "./authorizers";

export const createUserGroup = mutationField("createUserGroup", {
  description: "Creates a group in the user's organization",
  type: "UserGroup",
  authorize: authenticateAnd(contextUserIsAdmin()),
  validateArgs: validateAnd(
    notEmptyString((args) => args.name, "name"),
    maxLength((args) => args.name, "name", 100)
  ),
  args: {
    name: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.userGroups.createUserGroup(
        {
          org_id: ctx.user!.org_id,
          name: args.name.trim(),
        },
        `User:${ctx.user!.id}`
      );
    } catch (error) {
      if (error.constraint === "user_group__org_id__name") {
        throw new WhitelistedError(
          "A group with the same name already exists",
          "USER_GROUP_NAME_ALREADY_EXISTS"
        );
      } else {
        throw error;
      }
    }
  },
});

export const updateUserGroup = mutationField("updateUserGroup", {
  description: "Updates the name of a given user group",
  type: "UserGroup",
  authorize: authenticateAnd(userHasAccessToUserGroup("id")),
  validateArgs: validateAnd(
    notEmptyString((args) => args.data.name, "data.name")
  ),
  args: {
    id: nonNull(globalIdArg("UserGroup")),
    data: nonNull(
      inputObjectType({
        name: "UpdateUserGroupInput",
        definition(t) {
          t.string("name");
        },
      }).asArg()
    ),
  },
  resolve: async (_, args, ctx) => {
    const data: Partial<CreateTag> = {};
    if (args.data.name?.trim()) {
      data.name = args.data.name.trim();
    }
    try {
      const [userGroup] = await ctx.userGroups.updateUserGroupById(
        args.id,
        data,
        `User:${ctx.user!.id}`
      );
      return userGroup;
    } catch (error) {
      if (error.constraint === "user_group__org_id__name") {
        throw new WhitelistedError(
          "A group with the same name already exists",
          "USER_GROUP_NAME_ALREADY_EXISTS"
        );
      } else {
        throw error;
      }
    }
  },
});

export const deleteUserGroup = mutationField("deleteUserGroup", {
  description: "Removes the tag from every petition and soft-deletes it",
  type: "Result",
  authorize: authenticateAnd(userHasAccessToUserGroup("id")),
  args: {
    id: nonNull(globalIdArg("UserGroup")),
  },
  resolve: async (_, { id }, ctx) => {
    try {
      await ctx.tags.withTransaction(async (t) => {
        await ctx.tags.untagPetition(id, undefined, t);
        await ctx.tags.deleteTag(id, ctx.user!, t);
      });
      return RESULT.SUCCESS;
    } catch {
      return RESULT.FAILURE;
    }
  },
});

export const addUsersToUserGroup = mutationField("addUsersToUserGroup", {
  description: "Add users to a user group",
  type: "UserGroup",
  args: {
    userGroupId: nonNull(globalIdArg("UserGroup")),
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
  },
  authorize: authenticateAnd(
    userHasAccessToUserGroup("userGroupId"),
    userHasAccessToUsers("userIds")
  ),
  resolve: async (_, args, ctx) => {
    await ctx.userGroups.addUsersToGroup(
      args.userGroupId,
      args.userIds,
      `User:${ctx.user!.id}`
    );
    return (await ctx.userGroups.loadUserGroup(args.userGroupId))!;
  },
});

export const removeUsersFromGroup = mutationField("removeUsersFromGroup", {
  description: "Removes users from a user group",
  type: "UserGroup",
  args: {
    userGroupId: nonNull(globalIdArg("UserGroup")),
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
  },
  authorize: authenticateAnd(
    userHasAccessToUserGroup("userGroupId"),
    userHasAccessToUsers("userIds")
  ),
  resolve: async (_, args, ctx) => {
    await ctx.userGroups.removeUsersFromGroup(
      args.userGroupId,
      args.userIds,
      `User:${ctx.user!.id}`
    );
    return (await ctx.userGroups.loadUserGroup(args.userGroupId))!;
  },
});
