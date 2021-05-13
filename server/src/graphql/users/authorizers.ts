import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
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
  return (root, _, ctx) => {
    return ctx.user!.organization_role === "ADMIN";
  };
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
