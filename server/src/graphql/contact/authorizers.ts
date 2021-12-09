import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
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
        unMaybeArray(args[argName] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function userHasAccessToContactGroups<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number[][]>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const groups = args[argName] as unknown as number[][];
      const uniqueIds = Array.from(new Set(groups.flat()));
      return ctx.contacts.userHasAccessToContacts(ctx.user!, uniqueIds);
    } catch {}
    return false;
  };
}
