import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToTags<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const tagIds = unMaybeArray(args[argName]) as unknown as number[];
      const tags = await ctx.tags.loadTag(tagIds);
      return tags.every((tag) => tag?.organization_id === ctx.user!.org_id);
    } catch {}
    return false;
  };
}
