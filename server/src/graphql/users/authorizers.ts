import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { UserGroupPermissionName, UserStatus } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { Maybe, MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";
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
    const userIds = unMaybeArray(getArg(args, argName));
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
    const userIds = unMaybeArray(getArg(args, argName));
    const users = await ctx.users.loadUser(userIds);
    return users.every((u) => u && !u.is_org_owner);
  };
}

export function userIsNotContextUser<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => ctx.user!.id !== getArg(args, argName);
}

export function emailIsNotRegisteredInTargetOrg<
  TypeName extends string,
  FieldName extends string,
  TEmail extends Arg<TypeName, FieldName, string>,
  TOrgId extends Arg<TypeName, FieldName, Maybe<number>>,
>(emailArg: TEmail, orgIdArg: TOrgId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const email = getArg(args, emailArg);
    const targetOrgId = getArg(args, orgIdArg) ?? ctx.user!.org_id;
    const users = await ctx.users.loadUsersByEmail(email);

    const orgUser = users.find((u) => u.org_id === targetOrgId);
    if (orgUser) {
      const userData = await ctx.users.loadUserData(orgUser.user_data_id);
      throw new ApolloError(
        "The provided email is already registered on the organization",
        "USER_ALREADY_IN_ORG_ERROR",
        {
          user: {
            id: toGlobalId("User", orgUser.id),
            status: orgUser.status,
            fullName: fullName(userData!.first_name, userData!.last_name),
          },
        },
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
    const userId = getArg(args, userIdArg);
    const user = await ctx.users.loadUser(userId);
    return (user && unMaybeArray(validStatus).includes(user.status)) ?? false;
  };
}

export function maxActiveUsers<
  TypeName extends string,
  FieldName extends string,
  TUserIdsArg extends Arg<TypeName, FieldName, number[]>,
>(userIdsArg: TUserIdsArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = getArg(args, userIdsArg);

    const [org, activeUserCount] = await Promise.all([
      ctx.organizations.loadOrg(ctx.user!.org_id),
      ctx.organizations.loadActiveUserCount(ctx.user!.org_id),
    ]);

    if (org!.usage_details.USER_LIMIT < activeUserCount + userIds.length) {
      throw new ApolloError(`User limit reached for this organization`, "USER_LIMIT_ERROR", {
        userLimit: org!.usage_details.USER_LIMIT,
      });
    }

    return true;
  };
}
