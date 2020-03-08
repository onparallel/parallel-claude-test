import { FieldAuthorizeResolver } from "nexus";
import { Context } from "../../../context";
import { Organization as DbOrganization } from "../../../db/__types";

export function belongsToOrg<
  FieldName extends string
>(): FieldAuthorizeResolver<"Organization", FieldName> {
  return (root: DbOrganization, _args: any, ctx: Context) => {
    return ctx.user.org_id === root.id;
  };
}
