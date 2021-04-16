import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { Arg } from "../helpers/authorize";

export function userHasAccessToTag<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const tagId = (args[argName] as unknown) as number;
      const tag = await ctx.tags.loadTag(tagId);
      return tag?.organization_id === ctx.user!.org_id;
    } catch {}
    return false;
  };
}
