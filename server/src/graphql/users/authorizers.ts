import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { UserOrganizationRole } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
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

export function contextUserHasRole<TypeName extends string, FieldName extends string>(
  minRole: UserOrganizationRole
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (root, _, ctx) => userHasRole(ctx.user!, minRole);
}

export function contextUserIsNotSso<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return (root, _, ctx) => {
    return ctx.user!.is_sso_user === false;
  };
}

export function userIsNotSSO<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const users = await ctx.users.loadUser(userIds);
    return users.every((u) => u && !u.is_sso_user);
  };
}

export function userIsNotContextUser<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => ctx.user!.id !== (args[argName] as number);
}
