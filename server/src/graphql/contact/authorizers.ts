import { FieldAuthorizeResolver } from "@nexus/schema";
import { fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { Arg } from "../helpers/authorize";

export function userHasAccessToContact<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { id } = fromGlobalId(args[argName], "Contact");
      return ctx.contacts.userHasAccessToContacts(ctx.user!, [id]);
    } catch {}
    return false;
  };
}

export function userHasAccessToContacts<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string[]>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const { ids } = fromGlobalIds(args[argName], "Contact");
      return ctx.contacts.userHasAccessToContacts(ctx.user!, ids);
    } catch {}
    return false;
  };
}
