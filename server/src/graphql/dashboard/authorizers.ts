import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
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

export function dashboardExists<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const id = getArg(args, argName);
    const dashboard = await ctx.dashboards.loadDashboard(id);

    if (!dashboard) {
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

export function templateBelongsToDashboardOrganization<
  TypeName extends string,
  FieldName extends string,
  TTemplateIdArg extends Arg<TypeName, FieldName, number>,
  TDashboardIdArg extends Arg<TypeName, FieldName, number>,
>(
  templateIdArg: TTemplateIdArg,
  dashboardIdArg: TDashboardIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const templateId = getArg(args, templateIdArg);
    const dashboardId = getArg(args, dashboardIdArg);

    const template = await ctx.petitions.loadPetition(templateId);
    const dashboard = await ctx.dashboards.loadDashboard(dashboardId);

    if (!template || !dashboard || template.org_id !== dashboard.org_id) {
      throw new ForbiddenError("Template not found");
    }

    return true;
  };
}

export function profileTypeBelongsToDashboardOrganization<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeIdArg extends Arg<TypeName, FieldName, number>,
  TDashboardIdArg extends Arg<TypeName, FieldName, number>,
>(
  profileTypeIdArg: TProfileTypeIdArg,
  dashboardIdArg: TDashboardIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileTypeId = getArg(args, profileTypeIdArg);
    const dashboardId = getArg(args, dashboardIdArg);

    const profileType = await ctx.profiles.loadProfileType(profileTypeId);
    const dashboard = await ctx.dashboards.loadDashboard(dashboardId);

    if (!profileType || !dashboard || profileType.org_id !== dashboard.org_id) {
      throw new ForbiddenError("Profile Type not found");
    }

    return true;
  };
}
