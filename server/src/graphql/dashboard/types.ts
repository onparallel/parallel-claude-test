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

export const DashboardModule = interfaceType({
  name: "DashboardModule",
  definition(t) {
    t.nonNull.globalId("id");
    t.nullable.string("title");
    t.nonNull.field("size", {
      type: enumType({
        name: "DashboardModuleSize",
        members: DashboardModuleSizeValues,
      }),
      resolve: (o) => o.size,
    });
  },
  resolveType: (o) => {
    switch (o.type) {
      case "PARALLELS_NUMBER":
        return "DashboardParallelsNumberModule";
      case "PROFILES_NUMBER":
        return "DashboardProfilesNumberModule";
      case "PARALLELS_RATIO":
        return "DashboardParallelsRatioModule";
      case "PROFILES_RATIO":
        return "DashboardProfilesRatioModule";
      case "PARALLELS_PIE_CHART":
        return "DashboardParallelsPieChartModule";
      case "PROFILES_PIE_CHART":
        return "DashboardProfilesPieChartModule";
      case "CREATE_PARALLEL_BUTTON":
        return "DashboardCreateParallelButtonModule";
      default:
        throw new Error(`Unknown type: ${o.type}`);
    }
  },
});

export const DashboardNumberModuleResult = objectType({
  name: "DashboardNumberModuleResult",
  definition(t) {
    t.nonNull.int("value");
  },
});

export const DashboardParallelsNumberModule = objectType({
  name: "DashboardParallelsNumberModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nullable.field("result", { type: "DashboardNumberModuleResult" });
  },
});

export const DashboardProfilesNumberModule = objectType({
  name: "DashboardProfilesNumberModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nullable.field("result", { type: "DashboardNumberModuleResult" });
  },
});

export const DashboardRatioModuleResult = objectType({
  name: "DashboardRatioModuleResult",
  definition(t) {
    t.nonNull.list.nonNull.int("value");
    t.nonNull.boolean("isIncongruent");
  },
});

export const DashboardRatioModuleSettingsType = enumType({
  name: "DashboardRatioModuleSettingsType",
  members: ["PERCENTAGE", "RATIO"],
});

export const DashboardParallelsRatioModule = objectType({
  name: "DashboardParallelsRatioModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardParallelsRatioModuleSettings",
        definition(t) {
          t.nonNull.field("graphicType", { type: "DashboardRatioModuleSettingsType" });
        },
      }),
    });
    t.nullable.field("result", { type: "DashboardRatioModuleResult" });
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
        },
      }),
    });
    t.nullable.field("result", { type: "DashboardRatioModuleResult" });
  },
});

export const DashboardPieChartModuleSettingsType = enumType({
  name: "DashboardPieChartModuleSettingsType",
  members: ["DOUGHNUT", "PIE"],
});

export const DashboardPieChartModuleResult = objectType({
  name: "DashboardPieChartModuleResult",
  definition(t) {
    t.nonNull.list.nonNull.int("value");
    t.nonNull.boolean("isIncongruent");
  },
});

export const DashboardParallelsPieChartModule = objectType({
  name: "DashboardParallelsPieChartModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardParallelsPieChartModuleSettings",
        definition(t) {
          t.nonNull.field("graphicType", { type: "DashboardPieChartModuleSettingsType" });
          t.nonNull.list.nonNull.string("labels", {
            resolve: (o) => o.filters.map((f: any) => f.label),
          });
          t.nonNull.list.nonNull.string("colors", {
            resolve: (o) => o.filters.map((f: any) => f.color),
          });
        },
        sourceType: /* ts */ `{
          graphicType: "DOUGHNUT" | "PIE";
          filters: { label: string; color: string }[];
        }`,
      }),
    });
    t.nullable.field("result", { type: "DashboardPieChartModuleResult" });
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
          t.nonNull.list.nonNull.string("labels", {
            resolve: (o) => o.filters.map((f: any) => f.label),
          });
          t.nonNull.list.nonNull.string("colors", {
            resolve: (o) => o.filters.map((f: any) => f.color),
          });
        },
        sourceType: /* ts */ `{
          graphicType: "DOUGHNUT" | "PIE";
          filters: { label: string; color: string }[];
        }`,
      }),
    });
    t.nullable.field("result", { type: "DashboardPieChartModuleResult" });
  },
});

export const DashboardCreateParallelButtonModule = objectType({
  name: "DashboardCreateParallelButtonModule",
  definition(t) {
    t.implements("DashboardModule");
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardCreateParallelButtonModuleSettings",
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
