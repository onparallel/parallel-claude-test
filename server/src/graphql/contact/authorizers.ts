import { FieldAuthorizeResolver } from "@nexus/schema";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToContacts<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      return ctx.contacts.userHasAccessToContacts(
        ctx.user!,
        unMaybeArray(args[argName])
      );
    } catch {}
    return false;
  };
}
