import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { DashboardModuleType } from "../../db/__types";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";
import { ForbiddenError } from "../helpers/errors";

export function userHasAccessToDashboard<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const id = getArg(args, argName);
    const dashboard = await ctx.dashboards.loadDashboard(id);

    if (!dashboard || dashboard.org_id !== ctx.user!.org_id) {
      throw new ForbiddenError("Dashboard not found");
    }

    return true;
  };
}

export function moduleBelongsToDashboard<
  TypeName extends string,
  FieldName extends string,
  TModuleIdArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TDashboardIdArg extends Arg<TypeName, FieldName, number>,
>(
  moduleIdArg: TModuleIdArg,
  dashboardIdArg: TDashboardIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const dashboardId = getArg(args, dashboardIdArg);
    const moduleIds = unMaybeArray(getArg(args, moduleIdArg));
    const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
    const modules = await ctx.dashboards.loadDashboardModule(moduleIds);

    if (!dashboard || modules.some((module) => !module || module.dashboard_id !== dashboardId)) {
      throw new ForbiddenError("Module not found");
    }

    return true;
  };
}

export function moduleHasType<
  TypeName extends string,
  FieldName extends string,
  TModuleIdArg extends Arg<TypeName, FieldName, number>,
>(
  moduleIdArg: TModuleIdArg,
  type: DashboardModuleType,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const moduleId = getArg(args, moduleIdArg);
    const module = await ctx.dashboards.loadDashboardModule(moduleId);

    if (!module || module.type !== type) {
      throw new ForbiddenError(`Expected module of type ${type}`);
    }

    return true;
  };
}

export function dashboardCanCreateModule<
  TypeName extends string,
  FieldName extends string,
  TDashboardIdArg extends Arg<TypeName, FieldName, number>,
>(dashboardIdArg: TDashboardIdArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const dashboardId = getArg(args, dashboardIdArg);
    // do not cache as same loader may be called in gql response after creating the module
    const modules = await ctx.dashboards.loadModulesByDashboardId.raw(dashboardId);

    if (modules.length >= 20) {
      throw new ForbiddenError(`Dashboard cannot have more than 20 modules`);
    }

    return true;
  };
}
