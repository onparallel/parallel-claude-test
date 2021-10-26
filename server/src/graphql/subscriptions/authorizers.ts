import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToEventSubscription<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const subscriptionIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const subscriptions = await ctx.subscriptions.loadSubscription(subscriptionIds);
    return subscriptions.every((s) => s?.user_id === ctx.user!.id);
  };
}
