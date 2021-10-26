import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToTasks<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const taskIds = unMaybeArray(args[argName] as MaybeArray<number>);
      if (taskIds.length === 0) {
        return true;
      }
      return await ctx.task.userHasAccessToTasks(taskIds, ctx.user!.id);
    } catch {}
    return false;
  };
}
