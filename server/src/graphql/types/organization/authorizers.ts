import { FieldAuthorizeResolver } from "nexus";

export function belongsToOrg<
  FieldName extends string
>(): FieldAuthorizeResolver<"Organization", FieldName> {
  return (root, _, ctx) => {
    return ctx.user!.org_id === root.id;
  };
}
