import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { UserGroupPermissionName, UserStatus } from "../../db/__types";
import { Maybe, MaybeArray, unMaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";
import { ApolloError, ForbiddenError } from "../helpers/errors";

export function rootIsContextUser<FieldName extends string>(): FieldAuthorizeResolver<
  "User",
  FieldName
> {
  return (root, _, ctx) => {
    return ctx.user!.id === root.id;
  };
}

export function rootIsContextRealUser<FieldName extends string>(): FieldAuthorizeResolver<
  "User",
  FieldName
> {
  return (root, _, ctx) => {
    return ctx.realUser!.id === root.id;
  };
}

export function contextUserIsNotSso<
  TypeName extends string,
  FieldName extends string,
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    const userData = await ctx.users.loadUserData(ctx.user!.user_data_id);
    return userData?.is_sso_user === false;
  };
}

export function userIsNotSSO<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const userDatas = await ctx.users.loadUserDataByUserId(userIds);
    return userDatas.every((ud) => ud && !ud.is_sso_user);
  };
}

export function userIsNotOrgOwner<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const users = await ctx.users.loadUser(userIds);
    return users.every((u) => u && !u.is_org_owner);
  };
}

export function userIsNotContextUser<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => ctx.user!.id !== (args[argName] as unknown as number);
}

export function emailIsNotRegisteredInTargetOrg<
  TypeName extends string,
  FieldName extends string,
  TEmail extends Arg<TypeName, FieldName, string>,
  TOrgId extends Arg<TypeName, FieldName, Maybe<number>>,
>(emailArg: TEmail, orgIdArg: TOrgId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const email = args[emailArg] as unknown as string;
    const targetOrgId = args[orgIdArg] ?? ctx.user!.org_id;
    const users = await ctx.users.loadUsersByEmail(email);
    if (users.some((user) => user.org_id === targetOrgId)) {
      throw new ApolloError(
        "The provided email is already registered on the organization",
        "USER_ALREADY_IN_ORG_ERROR",
      );
    }

    return true;
  };
}

export function contextUserHasPermission<TypeName extends string, FieldName extends string>(
  permission: MaybeArray<UserGroupPermissionName>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    const permissions = unMaybeArray(permission);
    const userPermissions = await ctx.users.loadUserPermissions(ctx.user!.id);
    if (!permissions.every((p) => userPermissions.includes(p))) {
      throw new ForbiddenError(`User does not have permission: ${permissions.join(", ")}`);
    }

    return true;
  };
}

export function userHasStatus<
  TypeName extends string,
  FieldName extends string,
  TUserIdArg extends Arg<TypeName, FieldName, number>,
>(
  userIdArg: TUserIdArg,
  validStatus: MaybeArray<UserStatus>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userId = args[userIdArg] as unknown as number;
    const user = await ctx.users.loadUser(userId);
    return (user && unMaybeArray(validStatus).includes(user.status)) ?? false;
  };
}
