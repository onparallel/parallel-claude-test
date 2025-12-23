import { enumType, interfaceType, objectType } from "nexus";
import { assert } from "ts-essentials";
import { DashboardModuleSizeValues, DashboardPermissionTypeValues } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { ProfileQueryFilterOperatorValues } from "../../util/ProfileQueryFilter";

export const DashboardPermission = objectType({
  name: "DashboardPermission",
  definition(t) {
    t.nonNull.globalId("id", { prefixName: "DashboardPermission" });
    t.nonNull.field("type", { type: "DashboardPermissionType" });
    t.nullable.field("user", {
      type: "User",
      resolve: async (o, _, ctx) => {
        if (!o.user_id) {
          return null;
        }
        return await ctx.users.loadUser(o.user_id);
      },
    });
    t.nullable.field("userGroup", {
      type: "UserGroup",
      resolve: async (o, _, ctx) => {
        if (!o.user_group_id) {
          return null;
        }

        return await ctx.userGroups.loadUserGroup(o.user_group_id);
      },
    });
  },
});

export const DashboardPermissionType = enumType({
  name: "DashboardPermissionType",
  members: DashboardPermissionTypeValues,
});

export const Dashboard = objectType({
  name: "Dashboard",
  definition(t) {
    t.nonNull.globalId("id");
    t.nonNull.string("name");
    t.nonNull.list.nonNull.field("modules", {
      type: "DashboardModule",
      resolve: async (o, _, ctx) => await ctx.dashboards.loadModulesByDashboardId(o.id),
    });
    t.nonNull.boolean("isDefault", { resolve: () => false, deprecation: "remove!" });
    t.nonNull.boolean("isRefreshing", { resolve: (o) => o.is_refreshing });
    t.nullable.datetime("lastRefreshAt", { resolve: (o) => o.last_refresh_at });
    t.nonNull.field("myEffectivePermission", {
      type: "DashboardPermissionType",
      resolve: async (o, _, ctx) => {
        const permissions = await ctx.dashboards.loadDashboardEffectivePermissions(o.id);
        const myPermission = permissions.find((p) => p.user_id === ctx.user!.id);
        assert(myPermission, "My permission not found");
        return myPermission.type;
      },
    });
    t.nonNull.list.nonNull.field("permissions", {
      type: "DashboardPermission",
      resolve: async (o, _, ctx) =>
        await ctx.dashboards.loadDashboardPermissionsByDashboardId(o.id),
    });
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

export const DashboardModuleProfileFieldValuesFilter = objectType({
  name: "DashboardModuleProfileFieldValuesFilter",
  definition(t) {
    t.nullable.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
    t.nullable.field("operator", {
      type: enumType({
        name: "DashboardModuleProfileFieldValuesFilterOperator",
        members: ProfileQueryFilterOperatorValues,
      }),
    });
    t.nullable.json("value");
    t.nullable.field("logicalOperator", {
      type: enumType({
        name: "DashboardModuleProfileFieldValuesFilterGroupLogicalOperator",
        members: ["AND", "OR"],
      }),
    });
    t.nullable.list.nonNull.field("conditions", {
      type: "DashboardModuleProfileFieldValuesFilter",
    });
  },
});

export const DashboardModuleProfileFilter = objectType({
  name: "DashboardModuleProfileFilter",
  definition(t) {
    t.nullable.list.nonNull.field("status", { type: "ProfileStatus" });
    t.nullable.field("values", { type: "DashboardModuleProfileFieldValuesFilter" });
  },
});

export const DashboardModulePetitionFilter = objectType({
  name: "DashboardModulePetitionFilter",
  definition(t) {
    t.nullable.list.nonNull.field("status", { type: "PetitionStatus" });
    t.nullable.field("sharedWith", {
      type: objectType({
        name: "DashboardModulePetitionFilterSharedWith",
        definition(t) {
          t.nonNull.field("operator", {
            type: "FilterSharedWithLogicalOperator",
          });
          t.nonNull.list.nonNull.field("filters", {
            type: objectType({
              name: "DashboardModulePetitionFilterSharedWithFilters",
              definition(t) {
                t.nonNull.id("value");
                t.nonNull.field("operator", {
                  type: "FilterSharedWithOperator",
                });
              },
            }),
          });
        },
      }),
    });
    t.nullable.field("approvals", {
      type: objectType({
        name: "DashboardModulePetitionFilterApprovals",
        definition(t) {
          t.nonNull.field("operator", {
            type: "PetitionApprovalsFilterLogicalOperator",
          });
          t.nonNull.list.nonNull.field("filters", {
            type: objectType({
              name: "DashboardModulePetitionFilterApprovalsFilters",
              definition(t) {
                t.nonNull.string("value");
                t.nonNull.field("operator", {
                  type: "PetitionApprovalsFilterOperator",
                });
              },
            }),
            resolve: (o) =>
              o.filters.map((f: any) =>
                f.operator === "ASSIGNED_TO" ? { ...f, value: toGlobalId("User", f.value) } : f,
              ),
          });
        },
      }),
    });
    t.nullable.field("tags", {
      type: objectType({
        name: "DashboardModulePetitionFilterTags",
        definition(t) {
          t.nonNull.field("operator", {
            type: "PetitionTagFilterLogicalOperator",
          });
          t.nonNull.list.nonNull.field("filters", {
            type: objectType({
              name: "DashboardModulePetitionFilterTagsFilters",
              definition(t) {
                t.nonNull.list.nonNull.globalId("value", { prefixName: "Tag" });
                t.nonNull.field("operator", {
                  type: "PetitionTagFilterLineOperator",
                });
              },
            }),
          });
        },
      }),
    });
    t.nullable.list.nonNull.field("signature", { type: "PetitionSignatureStatusFilter" });
    t.nullable.list.nonNull.globalId("fromTemplateId", { prefixName: "Petition" });
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
    t.nullable.string("value", {
      description: "Value of the SELECT item, when grouping by a SELECT field",
    });
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
    t.nonNull.field("settings", {
      type: objectType({
        name: "DashboardPetitionsNumberModuleSettings",
        definition(t) {
          t.nonNull.field("filters", { type: "DashboardModulePetitionFilter" });
        },
      }),
    });
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
          t.nonNull.field("filters", { type: "DashboardModuleProfileFilter" });
          t.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
          t.nullable.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
          t.nullable.field("aggregate", { type: "ModuleResultAggregateType" });
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
          t.nonNull.list.field("filters", { type: "DashboardModulePetitionFilter" });
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
          t.nonNull.list.field("filters", { type: "DashboardModuleProfileFilter" });
          t.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
          t.nullable.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
          t.nullable.field("aggregate", { type: "ModuleResultAggregateType" });
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
          t.nonNull.list.field("items", {
            type: objectType({
              name: "DashboardPetitionsPieChartModuleItem",
              definition(t) {
                t.nonNull.string("label");
                t.nonNull.string("color");
                t.nonNull.field("filter", { type: "DashboardModulePetitionFilter" });
              },
            }),
          });
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
          t.nonNull.globalId("profileTypeId", { prefixName: "ProfileType" });
          t.nullable.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
          t.nullable.field("aggregate", { type: "ModuleResultAggregateType" });
          t.nullable.globalId("groupByProfileTypeFieldId", {
            prefixName: "ProfileTypeField",
            description: "Optional SELECT field to group by its values instead of items array",
          });
          t.nonNull.list.field("items", {
            type: objectType({
              name: "DashboardProfilesPieChartModuleItem",
              definition(t) {
                t.nonNull.string("label");
                t.nonNull.string("color");
                t.nonNull.field("filter", { type: "DashboardModuleProfileFilter" });
              },
            }),
          });
          t.nullable.field("groupByFilter", { type: "DashboardModuleProfileFilter" });
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
