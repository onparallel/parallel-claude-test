import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";

export function userHasAccessToNotifications<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const notificationIds = unMaybeArray(getArg(args, argName));
    const notifications = await ctx.petitions.loadPetitionUserNotifications(notificationIds);

    return notifications.every((n) => n && n.user_id === ctx.user!.id);
  };
}
