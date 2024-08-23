import { core } from "nexus";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { unique } from "remeda";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToContacts<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  prop: TArg | ((args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<number>),
): FieldAuthorizeResolver<TypeName, FieldName> {
  return (_, args, ctx) => {
    try {
      const contactIds = unique(
        unMaybeArray(
          (typeof prop === "function"
            ? (prop as any)(args)
            : (args as any)[prop]) as MaybeArray<number>,
        ),
      );

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
      const groups = args[argName] as unknown as number[][];
      const uniqueIds = Array.from(new Set(groups.flat()));
      return ctx.contacts.userHasAccessToContacts(ctx.user!, uniqueIds);
    } catch {}
    return false;
  };
}
