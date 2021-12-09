import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { IntegrationType } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToIntegrations<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg, types?: IntegrationType[]): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.integrations.userHasAccessToIntegration(
        unMaybeArray(args[argName] as unknown as MaybeArray<number>),
        ctx.user!,
        types
      );
    } catch {}
    return false;
  };
}
