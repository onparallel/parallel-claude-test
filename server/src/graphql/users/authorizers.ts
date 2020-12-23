import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";

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
