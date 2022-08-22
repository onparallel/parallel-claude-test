import { ApolloError } from "apollo-server-core";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { UserOrganizationRole } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { Maybe, MaybeArray } from "../../util/types";
import { userHasRole } from "../../util/userHasRole";
import { Arg } from "../helpers/authorize";

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

export function contextUserHasRole<TypeName extends string, FieldName extends string>(
  minRole: UserOrganizationRole
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (root, _, ctx) => userHasRole(ctx.user!, minRole);
}

export function contextUserIsNotSso<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, _, ctx) => {
    const userData = await ctx.users.loadUserData(ctx.user!.user_data_id);
    return userData?.is_sso_user === false;
  };
}

export function userIsNotSSO<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
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
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const users = await ctx.users.loadUser(userIds);
    return users.every((u) => u && u.organization_role !== "OWNER");
  };
}

export function userIsNotContextUser<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => ctx.user!.id !== (args[argName] as unknown as number);
}

export function emailIsNotRegisteredInTargetOrg<
  TypeName extends string,
  FieldName extends string,
  TEmail extends Arg<TypeName, FieldName, string>,
  TOrgId extends Arg<TypeName, FieldName, Maybe<number>>
>(emailArg: TEmail, orgIdArg: TOrgId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const email = args[emailArg] as unknown as string;
    const targetOrgId = args[orgIdArg] ?? ctx.user!.org_id;
    const users = await ctx.users.loadUsersByEmail(email);
    if (users.some((user) => user.org_id === targetOrgId)) {
      throw new ApolloError(
        "The provided email is already registered on the organization",
        "USER_ALREADY_IN_ORG_ERROR"
      );
    }

    return true;
  };
}
