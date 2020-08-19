import { FieldAuthorizeResolver } from "@nexus/schema";
import { Arg } from "../helpers/authorize";
import { fromGlobalId } from "../../util/globalId";

export function belongsToOrg<
  FieldName extends string
>(): FieldAuthorizeResolver<"Organization", FieldName> {
  return (root, _, ctx) => {
    return ctx.user!.org_id === root.id;
  };
}

export function belongsToOrgInProp<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id } = fromGlobalId(args[argName], "Organization");
      return ctx.user!.org_id === id;
    } catch {}
    return false;
  };
}
