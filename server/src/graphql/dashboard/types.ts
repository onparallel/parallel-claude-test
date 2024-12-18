import { enumType, interfaceType, objectType } from "nexus";
import { DashboardModuleSizeValues } from "../../db/__types";

export const Dashboard = objectType({
  name: "Dashboard",
  definition(t) {
    t.nonNull.globalId("id");
    t.nonNull.string("name");
    t.nonNull.list.nonNull.field("modules", {
      type: "DashboardModule",
      resolve: async (o, _, ctx) => await ctx.dashboards.loadModulesByDashboardId(o.id),
    });
    t.nonNull.boolean("isDefault", { resolve: (o) => o.is_default });
    t.nonNull.boolean("isRefreshing", { resolve: (o) => o.is_refreshing });
    t.nullable.datetime("lastRefreshAt", { resolve: (o) => o.last_refresh_at });
  },
});

export const DashboardModuleSize = enumType({
  name: "DashboardModuleSize",
  members: DashboardModuleSizeValues,
});

export const DashboardRatioModuleSettingsType = enumType({
  name: "DashboardRatioModuleSettingsType",
  members: ["PERCENTAGE", "RATIO"],
});

export const DashboardPieChartModuleSettingsType = enumType({
  name: "DashboardPieChartModuleSettingsType",
  members: ["DOUGHNUT", "PIE"],
});

export const ModuleResultType = enumType({
  name: "ModuleResultType",
  members: ["COUNT", "AGGREGATE"],
});

export const ModuleResultAggregateType = enumType({
  name: "ModuleResultAggregateType",
  members: ["SUM", "AVG", "MAX", "MIN"],
});

export const DashboardModule = interfaceType({
  name: "DashboardModule",
  definition(t) {
    t.nonNull.globalId("id");
    t.nullable.string("title");
    t.nonNull.field("size", {
      type: "DashboardModuleSize",
      resolve: (o) => o.size,
    });
  },
  resolveType: (o) => {
    switch (o.type) {
      case "PETITIONS_NUMBER":
        return "DashboardPetitionsNumberModule";
      case "PROFILES_NUMBER":
        return "DashboardProfilesNumberModule";
      case "PETITIONS_RATIO":
        return "DashboardPetitionsRatioModule";
      case "PROFILES_RATIO":
        return "DashboardProfilesRatioModule";
      case "PETITIONS_PIE_CHART":
        return "DashboardPetitionsPieChartModule";
      case "PROFILES_PIE_CHART":
        return "DashboardProfilesPieChartModule";
      case "CREATE_PETITION_BUTTON":
        return "DashboardCreatePetitionButtonModule";
      default:
        throw new Error(`Unknown type: ${o.type}`);
    }
  },
});

export const DashboardModuleResultItem = objectType({
  name: "DashboardModuleResultItem",
  definition(t) {
    t.nonNull.int("count");
    t.nullable.float("aggr");
    t.nullable.json("label", {
      description: "Label of the item, in string or LocalizableUserText format",
    });
    t.nullable.string("color");
  },
});

export const DashboardModuleResultMultiItem = objectType({
  name: "DashboardModuleResultMultiItem",
  definition(t) {
    t.nonNull.list.nonNull.field("items", { type: "DashboardModuleResultItem" });
    t.nonNull.boolean("isIncongruent");
  },
});

export const DashboardPetitionsNumberModule = objectType({
  name: "DashboardPetitionsNumberModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nullable.field("result", { type: "DashboardModuleResultItem" });
  },
});

export const DashboardProfilesNumberModule = objectType({
  name: "DashboardProfilesNumberModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardProfilesNumberModuleSettings",
        definition(t) {
          t.nonNull.field("type", { type: "ModuleResultType" });
        },
      }),
    });
    t.nullable.field("result", { type: "DashboardModuleResultItem" });
  },
});

export const DashboardPetitionsRatioModule = objectType({
  name: "DashboardPetitionsRatioModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardPetitionsRatioModuleSettings",
        definition(t) {
          t.nonNull.field("graphicType", { type: "DashboardRatioModuleSettingsType" });
        },
      }),
    });
    t.nullable.field("result", { type: "DashboardModuleResultMultiItem" });
  },
});

export const DashboardProfilesRatioModule = objectType({
  name: "DashboardProfilesRatioModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardProfilesRatioModuleSettings",
        definition(t) {
          t.nonNull.field("graphicType", { type: "DashboardRatioModuleSettingsType" });
          t.nonNull.field("type", { type: "ModuleResultType" });
        },
      }),
    });
    t.nullable.field("result", { type: "DashboardModuleResultMultiItem" });
  },
});

export const DashboardPetitionsPieChartModule = objectType({
  name: "DashboardPetitionsPieChartModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardPetitionsPieChartModuleSettings",
        definition(t) {
          t.nonNull.field("graphicType", { type: "DashboardPieChartModuleSettingsType" });
        },
      }),
    });
    t.nullable.field("result", { type: "DashboardModuleResultMultiItem" });
  },
});

export const DashboardProfilesPieChartModule = objectType({
  name: "DashboardProfilesPieChartModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardProfilesPieChartModuleSettings",
        definition(t) {
          t.nonNull.field("graphicType", { type: "DashboardPieChartModuleSettingsType" });
          t.nonNull.field("type", { type: "ModuleResultType" });
        },
      }),
    });
    t.nullable.field("result", { type: "DashboardModuleResultMultiItem" });
  },
});

export const DashboardCreatePetitionButtonModule = objectType({
  name: "DashboardCreatePetitionButtonModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardCreatePetitionButtonModuleSettings",
        definition(t) {
          t.nonNull.string("label");
          t.nullable.field("template", {
            type: "PetitionBaseMini",
            resolve: async (o, _, ctx) => await ctx.petitions.loadPetition(o.template_id),
          });
        },
        sourceType: /* ts */ `{
          label: string;
          template_id: number;
        }`,
      }),
    });
  },
});
