import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { IntegrationType } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToIntegration<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const integrationIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    const integrations = await ctx.integrations.loadIntegration(integrationIds);
    return integrations.every((i) => i && i.org_id === ctx.user!.org_id);
  };
}

export function integrationIsOfType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(integrationId: TArg, type: IntegrationType): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const integrationIds = unMaybeArray(args[integrationId] as unknown as MaybeArray<number>);
    const integrations = await ctx.integrations.loadIntegration(integrationIds);
    return integrations.every((i) => i && i.type === type);
  };
}
