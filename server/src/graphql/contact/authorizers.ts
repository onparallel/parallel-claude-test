import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { unique } from "remeda";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";

export function userHasAccessToContacts<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const contactIds = unique(unMaybeArray(getArg(args, argName)));

      if (contactIds.length === 0) {
        return true;
      }
      return ctx.contacts.userHasAccessToContacts(ctx.user!, contactIds);
    } catch {}
    return false;
  };
}

export function userHasAccessToContactGroups<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number[][]>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const groups = getArg(args, argName);
      const uniqueIds = Array.from(new Set(groups.flat()));
      return ctx.contacts.userHasAccessToContacts(ctx.user!, uniqueIds);
    } catch {}
    return false;
  };
}
