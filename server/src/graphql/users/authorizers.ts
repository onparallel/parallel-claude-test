import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { UserOrganizationRole } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function rootIsContextUser<
  FieldName extends string
>(): FieldAuthorizeResolver<"User", FieldName> {
  return (root, _, ctx) => {
    return ctx.user!.id === root.id;
  };
}

export function contextUserIsAdmin<
  TypeName extends string,
  FieldName extends string
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return (root, _, ctx) =>
    ["OWNER", "ADMIN"].includes(ctx.user!.organization_role);
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
    const userIds = unMaybeArray(
      args[argName] as unknown as MaybeArray<number>
    );
    const users = await ctx.users.loadUser(userIds);
    return users.every((u) => u && !u.is_sso_user);
  };
}

export function userHasRole<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(
  argName: TArg,
  role: MaybeArray<UserOrganizationRole>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const roles = unMaybeArray(role);
    const user = await ctx.users.loadUser(args[argName] as number);
    return !!user && roles.includes(user.organization_role);
  };
}

export function userIsNotContextUser<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => ctx.user!.id !== (args[argName] as number);
}
