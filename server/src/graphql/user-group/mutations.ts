import { enumType, inputObjectType, list, mutationField, nonNull, stringArg } from "nexus";
import pMap from "p-map";
import {
  CreateUserGroup,
  UserGroup,
  UserGroupPermissionEffectValues,
  UserGroupPermissionName,
} from "../../db/__types";
import { RESULT } from "../helpers/Result";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyString } from "../helpers/validators/notEmptyString";
import { userHasAccessToUsers } from "../petition/mutations/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import { userGroupCanBeDeleted, userGroupHasType, userHasAccessToUserGroups } from "./authorizers";
import { validUserGroupPermissionsInput } from "./validations";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { userHasFeatureFlag } from "../petition/authorizers";

export const createUserGroup = mutationField("createUserGroup", {
  description: "Creates a group in the user's organization",
  type: "UserGroup",
  authorize: authenticateAnd(contextUserHasPermission("TEAMS:CRUD_TEAMS")),
  validateArgs: validateAnd(
    notEmptyString((args) => args.name, "name"),
    maxLength((args) => args.name, "name", 100),
  ),
  args: {
    name: nonNull(stringArg()),
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.userGroups.withTransaction(async (t) => {
      const group = await ctx.userGroups.createUserGroup(
        {
          org_id: ctx.user!.org_id,
          name: args.name.trim(),
        },
        `User:${ctx.user!.id}`,
        t,
      );
      await ctx.userGroups.addUsersToGroups(group.id, args.userIds, `User:${ctx.user!.id}`, t);
      return group;
    });
  },
});

export const updateUserGroup = mutationField("updateUserGroup", {
  description: "Updates the name of a given user group",
  type: "UserGroup",
  authorize: authenticateAnd(
    contextUserHasPermission("TEAMS:CRUD_TEAMS"),
    userHasAccessToUserGroups("id"),
    userGroupHasType("id", ["NORMAL", "INITIAL"]),
  ),
  validateArgs: validateAnd(
    notEmptyString((args) => args.data.name, "data.name"),
    maxLength((args) => args.data.name, "data.name", 100),
  ),
  args: {
    id: nonNull(globalIdArg("UserGroup")),
    data: nonNull(
      inputObjectType({
        name: "UpdateUserGroupInput",
        definition(t) {
          t.string("name");
        },
      }).asArg(),
    ),
  },
  resolve: async (_, args, ctx) => {
    const data: Partial<CreateUserGroup> = {};
    if (args.data.name?.trim()) {
      data.name = args.data.name.trim();
    }

    const [userGroup] = await ctx.userGroups.updateUserGroupById(
      args.id,
      data,
      `User:${ctx.user!.id}`,
    );
    return userGroup;
  },
});

export const deleteUserGroup = mutationField("deleteUserGroup", {
  description: "Deletes a group",
  type: "Result",
  authorize: authenticateAnd(
    contextUserHasPermission("TEAMS:CRUD_TEAMS"),
    userHasAccessToUserGroups("ids"),
    userGroupCanBeDeleted("ids"),
  ),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("UserGroup")))),
  },
  resolve: async (_, { ids }, ctx) => {
    try {
      await ctx.userGroups.deleteUserGroups(ids, `User:${ctx.user!.id}`);
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
    contextUserHasPermission("TEAMS:CRUD_TEAMS"),
    userHasAccessToUserGroups("userGroupId"),
    userHasAccessToUsers("userIds"),
    userGroupHasType("userGroupId", ["NORMAL", "INITIAL"]),
  ),
  resolve: async (_, args, ctx) => {
    await ctx.userGroups.addUsersToGroups(args.userGroupId, args.userIds, `User:${ctx.user!.id}`);
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
    contextUserHasPermission("TEAMS:CRUD_TEAMS"),
    userHasAccessToUserGroups("userGroupId"),
    userHasAccessToUsers("userIds"),
    userGroupHasType("userGroupId", ["NORMAL", "INITIAL"]),
  ),
  resolve: async (_, args, ctx) => {
    await ctx.userGroups.removeUsersFromGroups(
      args.userIds,
      [args.userGroupId],
      `User:${ctx.user!.id}`,
    );
    return (await ctx.userGroups.loadUserGroup(args.userGroupId))!;
  },
});

export const cloneUserGroups = mutationField("cloneUserGroups", {
  description: "Clones the user groups with all its members",
  type: list("UserGroup"),
  args: {
    userGroupIds: nonNull(list(nonNull(globalIdArg("UserGroup")))),
    locale: nonNull("UserLocale"),
  },
  authorize: authenticateAnd(
    contextUserHasPermission("TEAMS:CRUD_TEAMS"),
    userHasAccessToUserGroups("userGroupIds"),
    userGroupHasType("userGroupIds", ["NORMAL", "INITIAL"]),
  ),
  resolve: async (_, args, ctx) => {
    const groups = (await ctx.userGroups.loadUserGroup(args.userGroupIds)) as UserGroup[];
    const intl = await ctx.i18n.getIntl(args.locale);
    return await pMap(groups, (group) =>
      ctx.userGroups.cloneUserGroup(
        group.id,
        group.name.concat(
          ` (${intl.formatMessage({
            id: "generic.copy",
            defaultMessage: "copy",
          })})`,
        ),
        ctx.user!,
      ),
    );
  },
});

export const updateUserGroupPermissions = mutationField("updateUserGroupPermissions", {
  description: "Updates the permissions of a user group",
  type: "UserGroup",
  authorize: authenticateAnd(
    userHasFeatureFlag("PERMISSION_MANAGEMENT"),
    contextUserHasPermission("TEAMS:UPDATE_PERMISSIONS"),
    userHasAccessToUserGroups("userGroupId"),
  ),
  args: {
    userGroupId: nonNull(globalIdArg("UserGroup")),
    permissions: nonNull(
      list(
        nonNull(
          inputObjectType({
            name: "UpdateUserGroupPermissionsInput",
            definition(t) {
              t.nonNull.string("name");
              t.nonNull.field("effect", {
                type: enumType({
                  name: "UpdateUserGroupPermissionsInputEffect",
                  members: [...UserGroupPermissionEffectValues, "NONE"],
                }),
              });
            },
          }).asArg(),
        ),
      ),
    ),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.permissions, "permissions"),
    validUserGroupPermissionsInput(
      (args) => args.userGroupId,
      (args) => args.permissions,
      "permissions",
    ),
  ),
  resolve: async (_, args, ctx) => {
    await ctx.userGroups.upsertUserGroupPermissions(
      args.userGroupId,
      args.permissions.map((p) => ({
        name: p.name as UserGroupPermissionName,
        effect: p.effect,
      })),
      `User:${ctx.user!.id}`,
    );

    return (await ctx.userGroups.loadUserGroup(args.userGroupId))!;
  },
});
