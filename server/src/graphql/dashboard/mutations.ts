import { inputObjectType, list, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isNonNullish, unique } from "remeda";
import { assert } from "ts-essentials";
import { DashboardModule } from "../../db/__types";
import { ModuleSettings } from "../../db/repositories/DashboardRepository";
import { PetitionFilter } from "../../db/repositories/PetitionRepository";
import { ProfileFilter } from "../../db/repositories/ProfileRepository";
import { ProfileFieldValuesFilter } from "../../util/ProfileFieldValuesFilter";
import { and, authenticateAnd, ifArgDefined, or } from "../helpers/authorize";
import { ArgValidationError, ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { mapPetitionFilterInput } from "../helpers/mapPetitionFilterInput";
import { SUCCESS } from "../helpers/Success";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import {
  petitionsAreNotScheduledForDeletion,
  petitionsAreOfTypeTemplate,
  userHasAccessToPetitions,
  userHasFeatureFlag,
} from "../petition/authorizers";
import { userHasAccessToUsers } from "../petition/mutations/authorizers";
import {
  profileTypeFieldBelongsToProfileType,
  userHasAccessToProfileType,
} from "../profile/authorizers";
import { userHasAccessToUserGroups } from "../user-group/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import {
  dashboardCanCreateModule,
  dashboardIsNotGroupSharedToContextUser,
  moduleBelongsToDashboard,
  moduleHasType,
  userHasAccessToDashboard,
} from "./authorizers";
import {
  validatePetitionsNumberDashboardModuleSettingsInput,
  validatePetitionsPieChartDashboardModuleSettingsInput,
  validatePetitionsRatioDashboardModuleSettingsInput,
  validateProfilesNumberDashboardModuleSettingsInput,
  validateProfilesPieChartDashboardModuleSettingsInput,
  validateProfilesRatioDashboardModuleSettingsInput,
} from "./validations";

export const createDashboard = mutationField("createDashboard", {
  type: "Dashboard",
  description: "Creates a new empty dashboard in the organization",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    contextUserHasPermission("DASHBOARDS:CREATE_DASHBOARDS"),
  ),
  args: {
    name: nonNull(stringArg()),
  },
  validateArgs: maxLength("name", 255),
  resolve: async (_, { name }, ctx) => {
    const dashboard = await ctx.dashboards.createDashboard(
      { org_id: ctx.user!.org_id, name },
      `User:${ctx.user!.id}`,
    );

    await ctx.dashboards.createDashboardPermissions(
      [{ dashboard_id: dashboard.id, user_id: ctx.user!.id, type: "OWNER" }],
      `User:${ctx.user!.id}`,
    );

    return dashboard;
  },
});

export const updateDashboard = mutationField("updateDashboard", {
  type: "Dashboard",
  description: "Updates a dashboard",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    userHasAccessToDashboard("id", "WRITE"),
  ),
  args: {
    id: nonNull(globalIdArg("Dashboard")),
    name: nonNull(stringArg()),
  },
  validateArgs: validateAnd(maxLength("name", 255)),
  resolve: async (_, { id, name }, ctx) => {
    return await ctx.dashboards.updateDashboard(id, { name }, `User:${ctx.user!.id}`);
  },
});

export const cloneDashboard = mutationField("cloneDashboard", {
  type: "Dashboard",
  description: "Clones a dashboard",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    contextUserHasPermission("DASHBOARDS:CREATE_DASHBOARDS"),
    userHasAccessToDashboard("id", "READ"),
  ),
  args: {
    id: nonNull(globalIdArg("Dashboard")),
    name: nonNull(stringArg()),
  },
  resolve: async (_, { id, name }, ctx) => {
    const dashboard = await ctx.dashboards.cloneDashboard(id, name, ctx.user!);

    await ctx.dashboards.createDashboardPermissions(
      [{ dashboard_id: dashboard.id, user_id: ctx.user!.id, type: "OWNER" }],
      `User:${ctx.user!.id}`,
    );

    return dashboard;
  },
});

export const deleteDashboard = mutationField("deleteDashboard", {
  type: "Success",
  description: "Deletes a dashboard",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    userHasAccessToDashboard("id", "READ"),
    or(dashboardIsNotGroupSharedToContextUser("id"), userHasAccessToDashboard("id", "OWNER")),
  ),
  args: {
    id: nonNull(globalIdArg("Dashboard")),
  },
  resolve: async (_, { id }, ctx) => {
    const permissions = await ctx.dashboards.loadDashboardEffectivePermissions(id);
    const myPermission = permissions.find((p) => p.user_id === ctx.user!.id);
    assert(myPermission, "My permission not found");

    if (myPermission.type === "OWNER") {
      await ctx.dashboards.deleteDashboard(id, `User:${ctx.user!.id}`);
    } else {
      await ctx.dashboards.deleteDashboardPermissionByUserId(
        id,
        ctx.user!.id,
        `User:${ctx.user!.id}`,
      );
    }

    return SUCCESS;
  },
});

export const createCreatePetitionButtonDashboardModule = mutationField(
  "createCreatePetitionButtonDashboardModule",
  {
    type: "Dashboard",
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      dashboardCanCreateModule("dashboardId"),
      userHasAccessToPetitions("settings.templateId"),
      petitionsAreOfTypeTemplate("settings.templateId"),
      petitionsAreNotScheduledForDeletion("settings.templateId"),
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
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      dashboardCanCreateModule("dashboardId"),
    ),
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
      validatePetitionsNumberDashboardModuleSettingsInput("settings"),
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
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      dashboardCanCreateModule("dashboardId"),
    ),
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
      validatePetitionsRatioDashboardModuleSettingsInput("settings"),
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
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      dashboardCanCreateModule("dashboardId"),
    ),
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
      validatePetitionsPieChartDashboardModuleSettingsInput("settings"),
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
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      dashboardCanCreateModule("dashboardId"),
      userHasAccessToProfileType("settings.profileTypeId"),
      ifArgDefined(
        "settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "settings.profileTypeFieldId" as never,
          "settings.profileTypeId",
        ),
      ),
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
              status: settings.filter.status ?? ["OPEN"],
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
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      dashboardCanCreateModule("dashboardId"),
      userHasAccessToProfileType("settings.profileTypeId"),
      ifArgDefined(
        "settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "settings.profileTypeFieldId" as never,
          "settings.profileTypeId",
        ),
      ),
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
            filters: settings.filters.map((f) => ({
              ...f,
              status: f.status ?? ["OPEN"],
            })) as [ProfileFilter, ProfileFilter],
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
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      dashboardCanCreateModule("dashboardId"),
      userHasAccessToProfileType("settings.profileTypeId"),
      ifArgDefined(
        "settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "settings.profileTypeFieldId" as never,
          "settings.profileTypeId",
        ),
      ),
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
                  status: settings.groupByFilter.status ?? ["OPEN"],
                  values: settings.groupByFilter.values as ProfileFieldValuesFilter,
                }
              : undefined,
            graphicType: settings.graphicType,
            items: settings.items.map((item) => ({
              color: item.color,
              label: item.label,
              filter: {
                status: item.filter.status ?? ["OPEN"],
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

export const updateCreatePetitionButtonDashboardModule = mutationField(
  "updateCreatePetitionButtonDashboardModule",
  {
    type: "DashboardModule",
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      moduleBelongsToDashboard("moduleId", "dashboardId"),
      moduleHasType("moduleId", "CREATE_PETITION_BUTTON"),
      ifArgDefined(
        "data.settings.templateId",
        and(
          userHasAccessToPetitions("data.settings.templateId"),
          petitionsAreOfTypeTemplate("data.settings.templateId"),
          petitionsAreNotScheduledForDeletion("data.settings.templateId"),
        ),
      ),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      moduleId: nonNull(globalIdArg("DashboardModule")),
      data: nonNull(
        inputObjectType({
          name: "UpdateCreatePetitionButtonDashboardModuleInput",
          definition(t) {
            t.nullable.string("title");
            t.nullable.field("size", { type: "DashboardModuleSize" });
            t.nullable.field("settings", {
              type: "CreatePetitionButtonDashboardModuleSettingsInput",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("data.title", 255),
      maxLength("data.settings.buttonLabel", 255),
    ),
    resolve: async (_, { moduleId, data }, ctx) => {
      const updateData: Partial<DashboardModule> = {};
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (isNonNullish(data.size)) {
        updateData.size = data.size;
      }
      if (isNonNullish(data.settings)) {
        updateData.settings = {
          label: data.settings.buttonLabel,
          template_id: data.settings.templateId,
        } as ModuleSettings<"CREATE_PETITION_BUTTON">;
      }

      return await ctx.dashboards.updateDashboardModule(
        moduleId,
        updateData,
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const updatePetitionsNumberDashboardModule = mutationField(
  "updatePetitionsNumberDashboardModule",
  {
    type: "DashboardModule",
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      moduleBelongsToDashboard("moduleId", "dashboardId"),
      moduleHasType("moduleId", "PETITIONS_NUMBER"),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      moduleId: nonNull(globalIdArg("DashboardModule")),
      data: nonNull(
        inputObjectType({
          name: "UpdatePetitionsNumberDashboardModuleInput",
          definition(t) {
            t.nullable.string("title");
            t.nullable.field("size", { type: "DashboardModuleSize" });
            t.nullable.field("settings", {
              type: "PetitionsNumberDashboardModuleSettingsInput",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("data.title", 255),
      validatePetitionsNumberDashboardModuleSettingsInput("data.settings"),
    ),
    resolve: async (_, { moduleId, data }, ctx) => {
      const updateData: Partial<DashboardModule> = {};
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (isNonNullish(data.size)) {
        updateData.size = data.size;
      }
      if (isNonNullish(data.settings)) {
        updateData.settings = {
          filters: mapPetitionFilterInput(data.settings.filters),
        } as ModuleSettings<"PETITIONS_NUMBER">;
        updateData.result = null;
      }

      return await ctx.dashboards.updateDashboardModule(
        moduleId,
        updateData,
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const updatePetitionsRatioDashboardModule = mutationField(
  "updatePetitionsRatioDashboardModule",
  {
    type: "DashboardModule",
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      moduleBelongsToDashboard("moduleId", "dashboardId"),
      moduleHasType("moduleId", "PETITIONS_RATIO"),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      moduleId: nonNull(globalIdArg("DashboardModule")),
      data: nonNull(
        inputObjectType({
          name: "UpdatePetitionsRatioDashboardModuleInput",
          definition(t) {
            t.nullable.string("title");
            t.nullable.field("size", { type: "DashboardModuleSize" });
            t.nullable.field("settings", {
              type: "PetitionsRatioDashboardModuleSettingsInput",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("data.title", 255),
      validatePetitionsRatioDashboardModuleSettingsInput("data.settings"),
    ),
    resolve: async (_, { moduleId, data }, ctx) => {
      const updateData: Partial<DashboardModule> = {};
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (isNonNullish(data.size)) {
        updateData.size = data.size;
      }
      if (isNonNullish(data.settings)) {
        updateData.settings = {
          graphicType: data.settings.graphicType,
          filters: data.settings.filters.map(mapPetitionFilterInput) as [
            PetitionFilter,
            PetitionFilter,
          ],
        } as ModuleSettings<"PETITIONS_RATIO">;
        updateData.result = null;
      }

      return await ctx.dashboards.updateDashboardModule(
        moduleId,
        updateData,
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const updatePetitionsPieChartDashboardModule = mutationField(
  "updatePetitionsPieChartDashboardModule",
  {
    type: "DashboardModule",
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      moduleBelongsToDashboard("moduleId", "dashboardId"),
      moduleHasType("moduleId", "PETITIONS_PIE_CHART"),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      moduleId: nonNull(globalIdArg("DashboardModule")),
      data: nonNull(
        inputObjectType({
          name: "UpdatePetitionsPieChartDashboardModuleInput",
          definition(t) {
            t.nullable.string("title");
            t.nullable.field("size", { type: "DashboardModuleSize" });
            t.nullable.field("settings", {
              type: "PetitionsPieChartDashboardModuleSettingsInput",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("data.title", 255),
      validatePetitionsPieChartDashboardModuleSettingsInput("data.settings"),
    ),
    resolve: async (_, { moduleId, data }, ctx) => {
      const updateData: Partial<DashboardModule> = {};
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (isNonNullish(data.size)) {
        updateData.size = data.size;
      }
      if (isNonNullish(data.settings)) {
        updateData.settings = {
          graphicType: data.settings.graphicType,
          items: data.settings.items.map((i) => ({
            ...i,
            filter: mapPetitionFilterInput(i.filter),
          })),
        } as ModuleSettings<"PETITIONS_PIE_CHART">;
        updateData.result = null;
      }

      return await ctx.dashboards.updateDashboardModule(
        moduleId,
        updateData,
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const updateProfilesNumberDashboardModule = mutationField(
  "updateProfilesNumberDashboardModule",
  {
    type: "DashboardModule",
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      moduleBelongsToDashboard("moduleId", "dashboardId"),
      moduleHasType("moduleId", "PROFILES_NUMBER"),
      userHasAccessToProfileType("data.settings.profileTypeId"),
      ifArgDefined(
        "data.settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "data.settings.profileTypeFieldId" as never,
          "data.settings.profileTypeId",
        ),
      ),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      moduleId: nonNull(globalIdArg("DashboardModule")),
      data: nonNull(
        inputObjectType({
          name: "UpdateProfilesNumberDashboardModuleInput",
          definition(t) {
            t.nullable.string("title");
            t.nullable.field("size", { type: "DashboardModuleSize" });
            t.nullable.field("settings", {
              type: "ProfilesNumberDashboardModuleSettingsInput",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("data.title", 255),
      validateProfilesNumberDashboardModuleSettingsInput("data.settings"),
    ),
    resolve: async (_, { moduleId, data }, ctx) => {
      const updateData: Partial<DashboardModule> = {};
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (isNonNullish(data.size)) {
        updateData.size = data.size;
      }
      if (isNonNullish(data.settings)) {
        updateData.settings = {
          ...(data.settings.type === "COUNT"
            ? { type: "COUNT" }
            : {
                type: "AGGREGATE",
                aggregate: data.settings.aggregate!,
                profileTypeFieldId: data.settings.profileTypeFieldId!,
              }),
          profileTypeId: data.settings.profileTypeId,
          filters: {
            status: data.settings.filter.status,
            values: data.settings.filter.values as ProfileFieldValuesFilter,
          },
        } as ModuleSettings<"PROFILES_NUMBER">;
        updateData.result = null;
      }

      return await ctx.dashboards.updateDashboardModule(
        moduleId,
        updateData,
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const updateProfilesRatioDashboardModule = mutationField(
  "updateProfilesRatioDashboardModule",
  {
    type: "DashboardModule",
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      moduleBelongsToDashboard("moduleId", "dashboardId"),
      moduleHasType("moduleId", "PROFILES_RATIO"),
      userHasAccessToProfileType("data.settings.profileTypeId"),
      ifArgDefined(
        "data.settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "data.settings.profileTypeFieldId" as never,
          "data.settings.profileTypeId",
        ),
      ),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      moduleId: nonNull(globalIdArg("DashboardModule")),
      data: nonNull(
        inputObjectType({
          name: "UpdateProfilesRatioDashboardModuleInput",
          definition(t) {
            t.nullable.string("title");
            t.nullable.field("size", { type: "DashboardModuleSize" });
            t.nullable.field("settings", {
              type: "ProfilesRatioDashboardModuleSettingsInput",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("data.title", 255),
      validateProfilesRatioDashboardModuleSettingsInput("data.settings"),
    ),
    resolve: async (_, { moduleId, data }, ctx) => {
      const updateData: Partial<DashboardModule> = {};
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (isNonNullish(data.size)) {
        updateData.size = data.size;
      }
      if (isNonNullish(data.settings)) {
        updateData.settings = {
          ...(data.settings.type === "COUNT"
            ? { type: "COUNT" }
            : {
                type: "AGGREGATE",
                aggregate: data.settings.aggregate!,
                profileTypeFieldId: data.settings.profileTypeFieldId!,
              }),
          profileTypeId: data.settings.profileTypeId,
          graphicType: data.settings.graphicType,
          filters: data.settings.filters as [ProfileFilter, ProfileFilter],
        } as ModuleSettings<"PROFILES_RATIO">;
        updateData.result = null;
      }

      return await ctx.dashboards.updateDashboardModule(
        moduleId,
        updateData,
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const updateProfilesPieChartDashboardModule = mutationField(
  "updateProfilesPieChartDashboardModule",
  {
    type: "DashboardModule",
    authorize: authenticateAnd(
      userHasFeatureFlag("DASHBOARDS"),
      userHasAccessToDashboard("dashboardId", "WRITE"),
      moduleBelongsToDashboard("moduleId", "dashboardId"),
      moduleHasType("moduleId", "PROFILES_PIE_CHART"),
      userHasAccessToProfileType("data.settings.profileTypeId"),
      ifArgDefined(
        "data.settings.profileTypeFieldId",
        profileTypeFieldBelongsToProfileType(
          "data.settings.profileTypeFieldId" as never,
          "data.settings.profileTypeId",
        ),
      ),
    ),
    args: {
      dashboardId: nonNull(globalIdArg("Dashboard")),
      moduleId: nonNull(globalIdArg("DashboardModule")),
      data: nonNull(
        inputObjectType({
          name: "UpdateProfilesPieChartDashboardModuleInput",
          definition(t) {
            t.nullable.string("title");
            t.nullable.field("size", { type: "DashboardModuleSize" });
            t.nullable.field("settings", {
              type: "ProfilesPieChartDashboardModuleSettingsInput",
            });
          },
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("data.title", 255),
      validateProfilesPieChartDashboardModuleSettingsInput("data.settings"),
    ),
    resolve: async (_, { moduleId, data }, ctx) => {
      const updateData: Partial<DashboardModule> = {};
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (isNonNullish(data.size)) {
        updateData.size = data.size;
      }
      if (isNonNullish(data.settings)) {
        updateData.settings = {
          ...(data.settings.type === "COUNT"
            ? { type: "COUNT" }
            : {
                type: "AGGREGATE",
                aggregate: data.settings.aggregate!,
                profileTypeFieldId: data.settings.profileTypeFieldId!,
              }),
          profileTypeId: data.settings.profileTypeId,
          groupByProfileTypeFieldId: data.settings.groupByProfileTypeFieldId ?? undefined,
          groupByFilter: data.settings.groupByFilter
            ? {
                status: data.settings.groupByFilter.status,
                values: data.settings.groupByFilter.values as ProfileFieldValuesFilter,
              }
            : undefined,
          graphicType: data.settings.graphicType,
          items: data.settings.items.map((item) => ({
            color: item.color,
            label: item.label,
            filter: {
              status: item.filter.status,
              values: item.filter.values as ProfileFieldValuesFilter,
            },
          })),
        } as ModuleSettings<"PROFILES_PIE_CHART">;
        updateData.result = null;
      }

      return await ctx.dashboards.updateDashboardModule(
        moduleId,
        updateData,
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const deleteDashboardModule = mutationField("deleteDashboardModule", {
  type: "Dashboard",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    userHasAccessToDashboard("dashboardId", "WRITE"),
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
    userHasFeatureFlag("DASHBOARDS"),
    userHasAccessToDashboard("dashboardId", "WRITE"),
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

export const createDashboardPermissions = mutationField("createDashboardPermissions", {
  type: "Dashboard",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    userHasAccessToDashboard("dashboardId", "WRITE"),
    userHasAccessToUsers("userIds"),
    userHasAccessToUserGroups("userGroupIds"),
  ),
  args: {
    dashboardId: nonNull(globalIdArg("Dashboard")),
    userIds: list(nonNull(globalIdArg("User"))),
    userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
    permissionType: nonNull("DashboardPermissionType"),
  },
  validateArgs: (_, args, ctx, info) => {
    if (
      (!args.userIds || args.userIds.length === 0) &&
      (!args.userGroupIds || args.userGroupIds.length === 0)
    ) {
      throw new ArgValidationError(
        info,
        "userIds, userGroupIds",
        "Must pass at least one user or user group",
      );
    }
    if (args.permissionType === "OWNER") {
      throw new ArgValidationError(info, "permissionType", "Cannot create OWNER permission");
    }
  },
  resolve: async (_, args, ctx) => {
    await ctx.dashboards.createDashboardPermissions(
      [
        ...unique(args.userIds ?? []).map((userId) => ({
          dashboard_id: args.dashboardId,
          user_id: userId,
          type: args.permissionType,
        })),
        ...unique(args.userGroupIds ?? []).map((userGroupId) => ({
          dashboard_id: args.dashboardId,
          user_group_id: userGroupId,
          type: args.permissionType,
        })),
      ],
      `User:${ctx.user!.id}`,
    );

    return (await ctx.dashboards.loadDashboard(args.dashboardId))!;
  },
});

export const updateDashboardPermission = mutationField("updateDashboardPermission", {
  type: "DashboardPermission",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    userHasAccessToDashboard("dashboardId", "WRITE"),
  ),
  args: {
    dashboardId: nonNull(globalIdArg("Dashboard")),
    permissionId: nonNull(globalIdArg("DashboardPermission")),
    newPermissionType: nonNull("DashboardPermissionType"),
  },
  validateArgs: (_, args, ctx, info) => {
    if (args.newPermissionType === "OWNER") {
      throw new ArgValidationError(info, "newPermissionType", "Cannot set permission to OWNER");
    }
  },
  resolve: async (_, args, ctx) => {
    const permission = await ctx.dashboards.updateDashboardPermissionType(
      args.dashboardId,
      args.permissionId,
      args.newPermissionType,
      `User:${ctx.user!.id}`,
    );

    if (!permission) {
      throw new ForbiddenError("Could not update permission");
    }

    return permission;
  },
});

export const deleteDashboardPermission = mutationField("deleteDashboardPermission", {
  type: "Dashboard",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    userHasAccessToDashboard("dashboardId", "WRITE"),
  ),
  args: {
    dashboardId: nonNull(globalIdArg("Dashboard")),
    permissionId: nonNull(globalIdArg("DashboardPermission")),
  },
  resolve: async (_, args, ctx) => {
    const permission = await ctx.dashboards.deleteDashboardPermission(
      args.dashboardId,
      args.permissionId,
      `User:${ctx.user!.id}`,
    );

    if (!permission) {
      throw new ForbiddenError("Could not delete permission");
    }

    return (await ctx.dashboards.loadDashboard(args.dashboardId))!;
  },
});

export const reorderDashboards = mutationField("reorderDashboards", {
  type: "User",
  authorize: authenticateAnd(
    userHasFeatureFlag("DASHBOARDS"),
    contextUserHasPermission("DASHBOARDS:LIST_DASHBOARDS"),
    userHasAccessToDashboard("ids", "READ"),
  ),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("Dashboard")))),
  },
  resolve: async (_, { ids }, ctx) => {
    return await ctx.dashboards.updateUserDashboardPreferences(
      ctx.user!.id,
      { tab_order: unique(ids) },
      `User:${ctx.user!.id}`,
    );
  },
});
