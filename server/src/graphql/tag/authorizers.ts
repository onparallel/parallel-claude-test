import { core } from "@nexus/schema";
import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { unMaybeArray } from "../../util/arrays";
import { fromGlobalIds } from "../../util/globalId";
import { MaybeArray } from "../../util/types";

export function userHasAccessToTags<
  TypeName extends string,
  FieldName extends string,
  TArg extends string | number
>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<TArg>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const tagIds = unMaybeArray(prop(args));

      const ids =
        typeof tagIds[0] === "string"
          ? fromGlobalIds(tagIds as string[], "Tag").ids
          : (tagIds as number[]);

      const tags = await ctx.tags.loadTag(ids);
      return tags.every((tag) => tag?.organization_id === ctx.user!.org_id);
    } catch {}
    return false;
  };
}
