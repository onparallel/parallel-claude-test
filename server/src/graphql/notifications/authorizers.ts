import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToNotifications<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const notificationIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const notifications = await ctx.petitions.loadPetitionUserNotifications(notificationIds);

    return notifications.every((n) => n && n.user_id === ctx.user!.id);
  };
}
