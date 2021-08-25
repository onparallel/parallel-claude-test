import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { isDefined } from "remeda";
import { ApiContext } from "../../context";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export async function contextUserHasAccessToUserGroups(userGroupIds: number[], ctx: ApiContext) {
  try {
    if (userGroupIds.length === 0) {
      return true;
    }
    return (await ctx.userGroups.loadUserGroup(userGroupIds)).every(
      (ug) => isDefined(ug) && ug.org_id === ctx.user!.org_id
    );
  } catch {}
  return false;
}

export function userHasAccessToUserGroups<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const userGroupIds = unMaybeArray(args[argName]) as unknown as number[];
      return await contextUserHasAccessToUserGroups(userGroupIds, ctx);
    } catch {}
    return false;
  };
}
