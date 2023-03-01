import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isDefined, uniq } from "remeda";
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

export function eventSubscriptionHasSignatureKeysLessThan<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(subscriptionIdArg: TArg, maxAmount: number): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const id = args[subscriptionIdArg] as unknown as number;
    const subscriptions =
      await ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(id);
    return subscriptions.length < maxAmount;
  };
}

export function userHasAccessToEventSubscriptionSignatureKeys<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const ids = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const keys = await ctx.subscriptions.loadEventSubscriptionSignatureKey(ids);
    if (!keys.every(isDefined)) {
      return false;
    }
    const subscriptionIds = uniq(keys.map((k) => k!.event_subscription_id));
    const subscriptions = await ctx.subscriptions.loadSubscription(subscriptionIds);
    return subscriptions.every((s) => s?.user_id === ctx.user!.id);
  };
}
