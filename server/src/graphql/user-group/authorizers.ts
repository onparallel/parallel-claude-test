import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToUserGroup<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const userGroupIds = unMaybeArray(args[argName]) as unknown as number[];
      const userGroups = await ctx.tags.loadTag(userGroupIds);
      return userGroups.every((ug) => ug?.organization_id === ctx.user!.org_id);
    } catch {}
    return false;
  };
}
