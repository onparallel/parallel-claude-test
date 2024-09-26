import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNullish } from "remeda";
import { Maybe, MaybeArray, unMaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToTags<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, Maybe<MaybeArray<number>> | undefined>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const arg = args[argName] as Maybe<MaybeArray<number>>;
      if (isNullish(arg)) {
        return true;
      }
      const tagIds = unMaybeArray(arg);
      const tags = await ctx.tags.loadTag(tagIds);
      return tags.every((tag) => tag?.organization_id === ctx.user!.org_id);
    } catch {}
    return false;
  };
}
