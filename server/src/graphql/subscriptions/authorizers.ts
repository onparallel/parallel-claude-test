import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNonNullish, unique } from "remeda";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";

export function userHasAccessToEventSubscription<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const subscriptionIds = unMaybeArray(getArg(args, argName));
    const subscriptions = await ctx.subscriptions.loadEventSubscription(subscriptionIds);
    return subscriptions.every((s) => s?.user_id === ctx.user!.id);
  };
}

export function eventSubscriptionHasSignatureKeysLessThan<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(subscriptionIdArg: TArg, maxAmount: number): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const id = getArg(args, subscriptionIdArg);
    const subscriptions =
      await ctx.subscriptions.loadEventSubscriptionSignatureKeysBySubscriptionId(id);
    return subscriptions.length < maxAmount;
  };
}

export function userHasAccessToEventSubscriptionSignatureKeys<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const ids = unMaybeArray(getArg(args, argName));
    const keys = await ctx.subscriptions.loadEventSubscriptionSignatureKey(ids);
    if (!keys.every(isNonNullish)) {
      return false;
    }
    const subscriptionIds = unique(keys.map((k) => k!.event_subscription_id));
    const subscriptions = await ctx.subscriptions.loadEventSubscription(subscriptionIds);
    return subscriptions.every((s) => s?.user_id === ctx.user!.id);
  };
}

export function petitionFieldsBelongsToTemplate<
  TypeName extends string,
  FieldName extends string,
  TFieldIdsArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TPetitionIdArg extends Arg<TypeName, FieldName, number>,
>(
  fieldIdsArg: TFieldIdsArg,
  petitionIdArg: TPetitionIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldIds = unMaybeArray(getArg(args, fieldIdsArg));
    const petitionId = getArg(args, petitionIdArg);
    const fields = await ctx.petitions.loadField(fieldIds);

    return fields.every((f) => isNonNullish(f) && f.petition_id === petitionId);
  };
}
