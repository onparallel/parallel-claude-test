import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";

export function belongsToOrg<
  FieldName extends string
>(): FieldAuthorizeResolver<"Organization", FieldName> {
  return (root, _, ctx) => {
    return ctx.user!.org_id === root.id;
  };
}
