import { gql } from "@apollo/client";
import {
  DashboardModuleDrawer_DashboardModuleFragment,
  DashboardModuleDrawer_DashboardModulePetitionFilterFragment,
  DashboardModuleProfileFieldValuesFilter,
  DashboardModuleSize,
  fullDashboardModuleProfileFilterFragment,
} from "@parallel/graphql/__types";
import { removeTypenames } from "@parallel/utils/apollo/removeTypenames";
import { ProfileFieldValuesFilter } from "@parallel/utils/ProfileFieldValuesFilter";
import { isNonNullish } from "remeda";
import {
  DashboardModuleDrawerFormData,
  ModuleCategory,
  ModuleDefinition,
  ModuleType,
} from "../DashboardModuleDrawer";

export function getDefaultFilters(moduleType: ModuleType) {
  switch (moduleType) {
    case "DashboardProfilesRatioModule":
      return [
        {
          status: ["OPEN"],
        },
        {
          status: ["OPEN"],
        },
      ];
    case "DashboardPetitionsRatioModule":
      return [{}, {}];
    case "DashboardProfilesNumberModule":
      return [
        {
          status: ["OPEN"],
        },
      ];
    case "DashboardPetitionsNumberModule":
      return [{}];
    default:
      return [];
  }
}

export function findTabForModuleType(
  moduleType: ModuleType,
  tabs: any[],
): {
  tab: (typeof tabs)[0];
  moduleDefinition: ModuleDefinition;
} | null {
  for (const tab of tabs) {
    const moduleDefinition = tab.modules.find((m: any) => m.type === moduleType);
    if (moduleDefinition) {
      return { tab, moduleDefinition };
    }
  }
  return null;
}

function cleanDashboardModuleProfileFieldValuesFilter(
  values: DashboardModuleProfileFieldValuesFilter,
): ProfileFieldValuesFilter {
  if (isNonNullish(values.logicalOperator)) {
    return {
      logicalOperator: values.logicalOperator!,
      conditions: values.conditions!.map(cleanDashboardModuleProfileFieldValuesFilter),
    };
  } else {
    return {
      profileTypeFieldId: values.profileTypeFieldId!,
      operator: values.operator!,
      value: values.value!,
    };
  }
}

export function cleanDashboardModuleProfileFilter(
  filter: fullDashboardModuleProfileFilterFragment,
) {
  return {
    values: isNonNullish(filter.values)
      ? cleanDashboardModuleProfileFieldValuesFilter(filter.values)
      : undefined,
    status: filter.status ?? undefined,
  };
}

export function cleanDashboardModulePetitionFilter(
  filter: DashboardModuleDrawer_DashboardModulePetitionFilterFragment,
) {
  return removeTypenames(filter);
}

export function getDefaultValuesFromModule(
  module: DashboardModuleDrawer_DashboardModuleFragment | null,
  tabs: {
    title: string;
    modules: { name: string; type: ModuleType; category: ModuleCategory }[];
  }[],
): DashboardModuleDrawerFormData {
  if (!module) {
    return { name: null, selectedModule: null, size: "SMALL", settings: {} };
  }

  const moduleType = module.__typename as ModuleType;

  const tabInfo = findTabForModuleType(moduleType, tabs);

  if (!tabInfo) {
    console.warn(`Configuration not found for module type: ${moduleType}`);
    return { name: null, selectedModule: null, size: "SMALL", settings: {} };
  }

  const { tab, moduleDefinition } = tabInfo;

  const selectedModule = {
    id: module.id,
    name: moduleDefinition.name,
    type: moduleType,
    category: moduleDefinition.category,
    tabTitle: tab.title,
  };

  // Settings based on module type
  const settings: DashboardModuleDrawerFormData["settings"] = {};

  switch (moduleType) {
    // Petition related modules
    case "DashboardPetitionsNumberModule":
      if ("petitionsNumberSettings" in module) {
        settings.filters = [
          cleanDashboardModulePetitionFilter(module.petitionsNumberSettings.filters),
        ];
      }
      break;
    case "DashboardPetitionsRatioModule":
      if ("petitionsRatioSettings" in module) {
        settings.ratioGraphicType = module.petitionsRatioSettings.graphicType;
        settings.filters = module.petitionsRatioSettings.filters.map(
          cleanDashboardModulePetitionFilter,
        );
      }
      break;
    case "DashboardPetitionsPieChartModule":
      if ("petitionsPieChartSettings" in module) {
        settings.chartGraphicType = module.petitionsPieChartSettings.graphicType;
        settings.items = module.petitionsPieChartSettings.items.map((item) => ({
          color: item.color,
          label: item.label,
          filters: [cleanDashboardModulePetitionFilter(item.filter)],
        }));
      }
      break;
    case "DashboardCreatePetitionButtonModule":
      if ("createPetitionButtonSettings" in module) {
        settings.buttonLabel = module.createPetitionButtonSettings.label;
        settings.templateId = module.createPetitionButtonSettings.template?.id;
      }
      break;
    // Profiles related modules
    case "DashboardProfilesNumberModule":
      if ("profilesNumberSettings" in module) {
        settings.type =
          module.profilesNumberSettings.type === "COUNT"
            ? "COUNT"
            : module.profilesNumberSettings.aggregate;
        settings.profileTypeId = module.profilesNumberSettings.profileTypeId ?? undefined;
        settings.profileTypeFieldId = module.profilesNumberSettings.profileTypeFieldId ?? undefined;
        settings.filters = [
          cleanDashboardModuleProfileFilter(module.profilesNumberSettings.filters),
        ];
      }
      break;
    case "DashboardProfilesRatioModule":
      if ("profilesRatioSettings" in module) {
        settings.type =
          module.profilesRatioSettings.type === "COUNT"
            ? "COUNT"
            : module.profilesRatioSettings.aggregate;
        settings.profileTypeId = module.profilesRatioSettings.profileTypeId ?? undefined;
        settings.profileTypeFieldId = module.profilesRatioSettings.profileTypeFieldId ?? undefined;
        settings.filters = module.profilesRatioSettings.filters.map((f) =>
          cleanDashboardModuleProfileFilter(f),
        );
        settings.ratioGraphicType = module.profilesRatioSettings.graphicType;
      }
      break;
    case "DashboardProfilesPieChartModule":
      if ("profilesPieChartSettings" in module) {
        settings.type =
          module.profilesPieChartSettings.type === "COUNT"
            ? "COUNT"
            : module.profilesPieChartSettings.aggregate;
        settings.chartGraphicType = module.profilesPieChartSettings.graphicType;
        settings.profileTypeId = module.profilesPieChartSettings.profileTypeId ?? undefined;
        settings.profileTypeFieldId =
          module.profilesPieChartSettings.profileTypeFieldId ?? undefined;
        settings.items = module.profilesPieChartSettings.items.map((item) => ({
          color: item.color,
          label: item.label,
          filters: [cleanDashboardModuleProfileFilter(item.filter)],
        }));
        settings.groupByProfileTypeFieldId =
          module.profilesPieChartSettings.groupByProfileTypeFieldId ?? undefined;
        settings.filters =
          isNonNullish(module.profilesPieChartSettings.groupByProfileTypeFieldId) &&
          isNonNullish(module.profilesPieChartSettings.groupByFilter)
            ? [cleanDashboardModuleProfileFilter(module.profilesPieChartSettings.groupByFilter)]
            : [];
      }
      break;
    default:
      console.warn(
        `getDefaultValuesFromModule - Configuration not found for module type: ${moduleType}`,
      );
      break;
  }

  return {
    name: module.title || null,
    selectedModule,
    size: (module.size as DashboardModuleSize) || "SMALL",
    settings,
  };
}

export function filterEmptyFilters(filters?: Record<string, any>[]) {
  if (!filters) return [];

  return filters.map((filter) => {
    return Object.fromEntries(
      Object.entries(filter).filter(
        ([_, value]) =>
          (Array.isArray(value) && value.length > 0) ||
          (typeof value === "object" &&
            value !== null &&
            ((Array.isArray(value.filters) && value.filters.length > 0) ||
              (Array.isArray(value.conditions) && value.conditions.length > 0))),
      ),
    );
  });
}

export const fullDashboardModuleProfileFilter = gql`
  fragment fullDashboardModuleProfileFilter on DashboardModuleProfileFilter {
    status
    values {
      logicalOperator
      operator
      profileTypeFieldId
      value
      conditions {
        logicalOperator
        operator
        profileTypeFieldId
        value
        conditions {
          logicalOperator
          operator
          profileTypeFieldId
          value
          conditions {
            logicalOperator
            operator
            profileTypeFieldId
            value
          }
        }
      }
    }
  }
`;
