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
    const integrationIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const integrations = await ctx.integrations.loadIntegration(integrationIds);
    return integrations.every(
      (i) => i?.type === "EVENT_SUBSCRIPTION" && (i.settings as any).USER_ID === ctx.user!.id
    );
  };
}
