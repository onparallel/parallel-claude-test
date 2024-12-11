import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { Arg, getArg } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";

export function userHasAccessToDashboard<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const id = getArg(args, argName);
    const dashboard = await ctx.dashboards.loadDashboard(id);

    if (!dashboard || dashboard.org_id !== ctx.user!.org_id) {
      throw new ApolloError("Dashboard not found", "DASHBOARD_NOT_FOUND");
    }

    return true;
  };
}
