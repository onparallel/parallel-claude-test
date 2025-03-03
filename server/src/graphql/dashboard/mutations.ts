import { inputObjectType, list, mutationField, nonNull, nullable, stringArg } from "nexus";
import { assert } from "ts-essentials";
import { PetitionFilter } from "../../db/repositories/PetitionRepository";
import { ProfileFilter } from "../../db/repositories/ProfileRepository";
import { ProfileFieldValuesFilter } from "../../util/ProfileFieldValuesFilter";
import { authenticateAnd, ifArgDefined, realUserIsSuperAdmin } from "../helpers/authorize";
import { ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { mapPetitionFilterInput } from "../helpers/mapPetitionFilterInput";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { petitionsAreOfTypeTemplate } from "../petition/authorizers";
import { profileTypeFieldBelongsToProfileType } from "../profile/authorizers";
import {
  dashboardExists,
  moduleBelongsToDashboard,
  profileTypeBelongsToDashboardOrganization,
  templateBelongsToDashboardOrganization,
} from "./authorizers";
import {
  validatePetitionsNumberDashboardModuleSettingsInput,
  validatePetitionsPieChartDashboardModuleSettingsInput,
  validatePetitionsRatioDashboardModuleSettingsInput,
  validateProfilesNumberDashboardModuleSettingsInput,
  validateProfilesPieChartDashboardModuleSettingsInput,
  validateProfilesRatioDashboardModuleSettingsInput,
} from "./validations";

export const adminCreateDashboard = mutationField("adminCreateDashboard", {
  type: "Dashboard",
  description: "Creates a new dashboard in the organization",
  authorize: authenticateAnd(realUserIsSuperAdmin()),
  args: {
    orgId: nonNull(globalIdArg("Organization")),
    name: nonNull(stringArg()),
  },
  resolve: async (_, { orgId, name }, ctx) => {
    return await ctx.dashboards.createDashboard({ org_id: orgId, name }, `User:${ctx.user!.id}`);
  },
});

export const createCreatePetitionButtonDashboardModule = mutationField(
  "createCreatePetitionButtonDashboardModule",
  {
    type: "Dashboard",
    authorize: authenticateAnd(
      realUserIsSuperAdmin(),
      dashboardExists("dashboardId"),
      templateBelongsToDashboardOrganization("settings.templateId", "dashboardId"),
      petitionsAreOfTypeTemplate("settings.templateId"),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      title: nullable(stringArg()),
      size: nonNull("DashboardModuleSize"),
      settings: nonNull(
        inputObjectType({
          name: "CreatePetitionButtonDashboardModuleSettingsInput",
          definition(t) {
            t.nonNull.globalId("templateId", { prefixName: "Petition" });
            t.nonNull.string("buttonLabel");
          },
        }),
      ),
    },
    validateArgs: validateAnd(maxLength("title", 255), maxLength("settings.buttonLabel", 255)),
    resolve: async (_, { dashboardId, title, size, settings }, ctx) => {
      await ctx.dashboards.createDashboardModule(
        {
          type: "CREATE_PETITION_BUTTON",
          dashboard_id: dashboardId,
          title,
          size,
          settings: {
            label: settings.buttonLabel,
            template_id: settings.templateId,
          },
        },
        `User:${ctx.user!.id}`,
      );

      const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
      assert(dashboard, "Dashboard not found");
      return dashboard;
    },
  },
);

export const createPetitionsNumberDashboardModule = mutationField(
  "createPetitionsNumberDashboardModule",
  {
    type: "Dashboard",
    authorize: authenticateAnd(realUserIsSuperAdmin(), dashboardExists("dashboardId")),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      title: nullable(stringArg()),
      size: nonNull("DashboardModuleSize"),
      settings: nonNull(
        inputObjectType({
          name: "PetitionsNumberDashboardModuleSettingsInput",
          definition(t) {
            t.nonNull.field("filters", { type: "PetitionFilter" });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("title", 255),
      validatePetitionsNumberDashboardModuleSettingsInput("dashboardId", "settings"),
    ),
    resolve: async (_, { dashboardId, title, size, settings }, ctx) => {
      await ctx.dashboards.createDashboardModule(
        {
          type: "PETITIONS_NUMBER",
          dashboard_id: dashboardId,
          title,
          size,
          settings: {
            filters: mapPetitionFilterInput(settings.filters),
          },
        },
        `User:${ctx.user!.id}`,
      );

      const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
      assert(dashboard, "Dashboard not found");
      return dashboard;
    },
  },
);

export const createPetitionsRatioDashboardModule = mutationField(
  "createPetitionsRatioDashboardModule",
  {
    type: "Dashboard",
    authorize: authenticateAnd(realUserIsSuperAdmin(), dashboardExists("dashboardId")),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      title: nullable(stringArg()),
      size: nonNull("DashboardModuleSize"),
      settings: nonNull(
        inputObjectType({
          name: "PetitionsRatioDashboardModuleSettingsInput",
          definition(t) {
            t.nonNull.field("graphicType", { type: "DashboardRatioModuleSettingsType" });
            t.nonNull.list.nonNull.field("filters", { type: "PetitionFilter" });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("title", 255),
      validatePetitionsRatioDashboardModuleSettingsInput("dashboardId", "settings"),
    ),
    resolve: async (_, { dashboardId, title, size, settings }, ctx) => {
      await ctx.dashboards.createDashboardModule(
        {
          type: "PETITIONS_RATIO",
          dashboard_id: dashboardId,
          title,
          size,
          settings: {
            graphicType: settings.graphicType,
            filters: settings.filters.map(mapPetitionFilterInput) as [
              PetitionFilter,
              PetitionFilter,
            ],
          },
        },
        `User:${ctx.user!.id}`,
      );

      const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
      assert(dashboard, "Dashboard not found");
      return dashboard;
    },
  },
);

export const createPetitionsPieChartDashboardModule = mutationField(
  "createPetitionsPieChartDashboardModule",
  {
    type: "Dashboard",
    authorize: authenticateAnd(realUserIsSuperAdmin(), dashboardExists("dashboardId")),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      title: nullable(stringArg()),
      size: nonNull("DashboardModuleSize"),
      settings: nonNull(
        inputObjectType({
          name: "PetitionsPieChartDashboardModuleSettingsInput",
          definition(t) {
            t.nonNull.field("graphicType", { type: "DashboardPieChartModuleSettingsType" });
            t.nonNull.list.nonNull.field("items", {
              type: inputObjectType({
                name: "PetitionsPieChartDashboardModuleSettingsItemInput",
                definition(t) {
                  t.nonNull.field("filter", { type: "PetitionFilter" });
                  t.nonNull.string("label");
                  t.nonNull.string("color");
                },
              }),
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("title", 255),
      validatePetitionsPieChartDashboardModuleSettingsInput("dashboardId", "settings"),
    ),
    resolve: async (_, { dashboardId, title, size, settings }, ctx) => {
      await ctx.dashboards.createDashboardModule(
        {
          type: "PETITIONS_PIE_CHART",
          dashboard_id: dashboardId,
          title,
          size,
          settings: {
            graphicType: settings.graphicType,
            items: settings.items.map((i) => ({
              ...i,
              filter: mapPetitionFilterInput(i.filter),
            })),
          },
        },
        `User:${ctx.user!.id}`,
      );

      const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
      assert(dashboard, "Dashboard not found");
      return dashboard;
    },
  },
);

export const createProfilesNumberDashboardModule = mutationField(
  "createProfilesNumberDashboardModule",
  {
    type: "Dashboard",
    authorize: authenticateAnd(
      realUserIsSuperAdmin(),
      dashboardExists("dashboardId"),
      ifArgDefined(
        "settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "settings.profileTypeFieldId" as never,
          "settings.profileTypeId",
        ),
      ),
      profileTypeBelongsToDashboardOrganization("settings.profileTypeId", "dashboardId"),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      title: nullable(stringArg()),
      size: nonNull("DashboardModuleSize"),
      settings: nonNull(
        inputObjectType({
          name: "ProfilesNumberDashboardModuleSettingsInput",
          definition(t) {
            t.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
            t.nonNull.field("filter", { type: "ProfileFilter" });
            t.nonNull.field("type", { type: "ModuleResultType" });
            t.nullable.globalId("profileTypeFieldId", {
              prefixName: "ProfileTypeField",
              description: "Field to aggregate on. Only for type AGGREGATE",
            });
            t.nullable.field("aggregate", {
              type: "ModuleResultAggregateType",
              description: "Aggregate function. Only for type AGGREGATE",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("title", 255),
      validateProfilesNumberDashboardModuleSettingsInput("settings"),
    ),
    resolve: async (_, { dashboardId, title, size, settings }, ctx) => {
      await ctx.dashboards.createDashboardModule(
        {
          type: "PROFILES_NUMBER",
          dashboard_id: dashboardId,
          title,
          size,
          settings: {
            ...(settings.type === "COUNT"
              ? { type: "COUNT" }
              : {
                  type: "AGGREGATE",
                  aggregate: settings.aggregate!,
                  profileTypeFieldId: settings.profileTypeFieldId!,
                }),
            profileTypeId: settings.profileTypeId,
            filters: {
              status: settings.filter.status,
              values: settings.filter.values as ProfileFieldValuesFilter,
            },
          },
        },
        `User:${ctx.user!.id}`,
      );

      const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
      assert(dashboard, "Dashboard not found");
      return dashboard;
    },
  },
);

export const createProfilesRatioDashboardModule = mutationField(
  "createProfilesRatioDashboardModule",
  {
    type: "Dashboard",
    authorize: authenticateAnd(
      realUserIsSuperAdmin(),
      dashboardExists("dashboardId"),
      ifArgDefined(
        "settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "settings.profileTypeFieldId" as never,
          "settings.profileTypeId",
        ),
      ),
      profileTypeBelongsToDashboardOrganization("settings.profileTypeId", "dashboardId"),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      title: nullable(stringArg()),
      size: nonNull("DashboardModuleSize"),
      settings: nonNull(
        inputObjectType({
          name: "ProfilesRatioDashboardModuleSettingsInput",
          definition(t) {
            t.nonNull.field("graphicType", { type: "DashboardRatioModuleSettingsType" });
            t.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
            t.nonNull.list.nonNull.field("filters", { type: "ProfileFilter" });
            t.nonNull.field("type", { type: "ModuleResultType" });
            t.nullable.globalId("profileTypeFieldId", {
              prefixName: "ProfileTypeField",
              description: "Field to aggregate on. Only for type AGGREGATE",
            });
            t.nullable.field("aggregate", {
              type: "ModuleResultAggregateType",
              description: "Aggregate function. Only for type AGGREGATE",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("title", 255),
      validateProfilesRatioDashboardModuleSettingsInput("settings"),
    ),
    resolve: async (_, { dashboardId, title, size, settings }, ctx) => {
      await ctx.dashboards.createDashboardModule(
        {
          type: "PROFILES_RATIO",
          dashboard_id: dashboardId,
          title,
          size,
          settings: {
            ...(settings.type === "COUNT"
              ? { type: "COUNT" }
              : {
                  type: "AGGREGATE",
                  aggregate: settings.aggregate!,
                  profileTypeFieldId: settings.profileTypeFieldId!,
                }),
            profileTypeId: settings.profileTypeId,
            graphicType: settings.graphicType,
            filters: settings.filters as [ProfileFilter, ProfileFilter],
          },
        },
        `User:${ctx.user!.id}`,
      );

      const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
      assert(dashboard, "Dashboard not found");
      return dashboard;
    },
  },
);

export const createProfilesPieChartDashboardModule = mutationField(
  "createProfilesPieChartDashboardModule",
  {
    type: "Dashboard",
    authorize: authenticateAnd(
      realUserIsSuperAdmin(),
      dashboardExists("dashboardId"),
      ifArgDefined(
        "settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "settings.profileTypeFieldId" as never,
          "settings.profileTypeId",
        ),
      ),
      profileTypeBelongsToDashboardOrganization("settings.profileTypeId", "dashboardId"),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      title: nullable(stringArg()),
      size: nonNull("DashboardModuleSize"),
      settings: nonNull(
        inputObjectType({
          name: "ProfilesPieChartDashboardModuleSettingsInput",
          definition(t) {
            t.nonNull.field("graphicType", { type: "DashboardPieChartModuleSettingsType" });
            t.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
            t.nonNull.list.nonNull.field("items", {
              type: inputObjectType({
                name: "ProfilesPieChartDashboardModuleSettingsItemInput",
                definition(t) {
                  t.nonNull.string("label");
                  t.nonNull.string("color");
                  t.nonNull.field("filter", { type: "ProfileFilter" });
                },
              }),
            });
            t.nonNull.field("type", { type: "ModuleResultType" });
            t.nullable.globalId("profileTypeFieldId", {
              prefixName: "ProfileTypeField",
              description: "Field to aggregate on. Only for type AGGREGATE",
            });
            t.nullable.field("aggregate", {
              type: "ModuleResultAggregateType",
              description: "Aggregate function. Only for type AGGREGATE",
            });
            t.nullable.globalId("groupByProfileTypeFieldId", {
              prefixName: "ProfileTypeField",
              description: "Optional SELECT field to group by its values instead of items array",
            });
            t.nullable.field("groupByFilter", {
              type: "ProfileFilter",
              description: "Optional filter to apply to all items when grouping by a field",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("title", 255),
      validateProfilesPieChartDashboardModuleSettingsInput("settings"),
    ),
    resolve: async (_, { dashboardId, title, size, settings }, ctx) => {
      await ctx.dashboards.createDashboardModule(
        {
          type: "PROFILES_PIE_CHART",
          dashboard_id: dashboardId,
          title,
          size,
          settings: {
            ...(settings.type === "COUNT"
              ? { type: "COUNT" }
              : {
                  type: "AGGREGATE",
                  aggregate: settings.aggregate!,
                  profileTypeFieldId: settings.profileTypeFieldId!,
                }),
            profileTypeId: settings.profileTypeId,
            groupByProfileTypeFieldId: settings.groupByProfileTypeFieldId ?? undefined,
            groupByFilter: settings.groupByFilter
              ? {
                  status: settings.groupByFilter.status,
                  values: settings.groupByFilter.values as ProfileFieldValuesFilter,
                }
              : undefined,
            graphicType: settings.graphicType,
            items: settings.items.map((item) => ({
              color: item.color,
              label: item.label,
              filter: {
                status: item.filter.status,
                values: item.filter.values as ProfileFieldValuesFilter,
              },
            })),
          },
        },
        `User:${ctx.user!.id}`,
      );

      const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
      assert(dashboard, "Dashboard not found");
      return dashboard;
    },
  },
);

export const deleteDashboardModule = mutationField("deleteDashboardModule", {
  type: "Dashboard",
  authorize: authenticateAnd(
    realUserIsSuperAdmin(),
    dashboardExists("dashboardId"),
    moduleBelongsToDashboard("moduleId", "dashboardId"),
  ),
  args: {
    dashboardId: nonNull(globalIdArg("Dashboard")),
    moduleId: nonNull(globalIdArg("DashboardModule")),
  },
  resolve: async (_, { dashboardId, moduleId }, ctx) => {
    await ctx.dashboards.deleteDashboardModule(dashboardId, moduleId, `User:${ctx.user!.id}`);

    const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
    assert(dashboard, "Dashboard not found");
    return dashboard;
  },
});

export const updateDashboardModulePositions = mutationField("updateDashboardModulePositions", {
  type: "Dashboard",
  authorize: authenticateAnd(
    realUserIsSuperAdmin(),
    dashboardExists("dashboardId"),
    moduleBelongsToDashboard("moduleIds", "dashboardId"),
  ),
  args: {
    dashboardId: nonNull(globalIdArg("Dashboard")),
    moduleIds: nonNull(list(nonNull(globalIdArg("DashboardModule")))),
  },
  resolve: async (_, { dashboardId, moduleIds }, ctx) => {
    try {
      await ctx.dashboards.updateDashboardModulePositions(
        dashboardId,
        moduleIds,
        `User:${ctx.user!.id}`,
      );

      const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
      assert(dashboard, "Dashboard not found");
      return dashboard;
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_MODULE_IDS") {
        throw new ForbiddenError("Invalid module ids");
      }
      throw error;
    }
  },
});
