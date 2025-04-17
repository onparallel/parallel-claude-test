import {
  DashboardModuleDrawer_DashboardModuleFragment,
  DashboardModuleDrawer_DashboardModulePetitionFilterFragment,
  DashboardModuleDrawer_DashboardModuleProfileFilterFragment,
  DashboardModuleSize,
} from "@parallel/graphql/__types";
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

/**
 * Recursively removes all properties with nullish values (null or undefined)
 * and all "__typename" properties from a filter object and its nested objects
 * @param obj The object to clean
 * @returns The clean object without nullish properties and __typename
 */
function removeNullishValues<T>(obj: T): T {
  // If it's not an object or it's null, return the value as is
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // If it's an array, clean each element of the array
  if (Array.isArray(obj)) {
    return obj.map((item) => removeNullishValues(item)) as unknown as T;
  }

  // Create a new object to store cleaned properties
  const cleanedObj = {} as T;

  // Go through all the properties of the object
  Object.entries(obj).forEach(([key, value]) => {
    // Skip __typename properties and nullish values
    if (key === "__typename" || value === null || value === undefined) {
      return;
    }

    // If it's an object, apply the function recursively
    if (typeof value === "object") {
      (cleanedObj as any)[key] = removeNullishValues(value);
    } else {
      // If it's a simple value, copy it directly
      (cleanedObj as any)[key] = value;
    }
  });

  return cleanedObj;
}

export function mapProfileFilter(
  filter: DashboardModuleDrawer_DashboardModuleProfileFilterFragment,
) {
  // Clean nullish values from the filter
  const cleanedValues = removeNullishValues(filter.values);

  return {
    values: cleanedValues,
    status: filter.status,
  };
}

export function mapPetitionFilter(
  filter: DashboardModuleDrawer_DashboardModulePetitionFilterFragment,
) {
  // Clean nullish values and "__typename" from the filter
  const cleanedValues = removeNullishValues(filter);

  return {
    status: cleanedValues.status,
    signature: cleanedValues.signature,
    tags: cleanedValues.tags,
    fromTemplateId: cleanedValues.fromTemplateId,
    sharedWith: cleanedValues.sharedWith,
    approvals: cleanedValues.approvals,
  };
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
        settings.filters = [mapPetitionFilter(module.petitionsNumberSettings.filters)];
      }
      break;
    case "DashboardPetitionsRatioModule":
      if ("petitionsRatioSettings" in module) {
        settings.ratioGraphicType = module.petitionsRatioSettings.graphicType;
        settings.filters = module.petitionsRatioSettings.filters.map(mapPetitionFilter);
      }
      break;
    case "DashboardPetitionsPieChartModule":
      if ("petitionsPieChartSettings" in module) {
        settings.chartGraphicType = module.petitionsPieChartSettings.graphicType;
        settings.items = module.petitionsPieChartSettings.items.map((item) => ({
          color: item.color,
          label: item.label,
          filters: [mapPetitionFilter(item.filter)],
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
        settings.filters = [mapProfileFilter(module.profilesNumberSettings.filters)];
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
        settings.filters = module.profilesRatioSettings.filters.map(mapProfileFilter);
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
          filters: [mapProfileFilter(item.filter)],
        }));
        settings.groupByProfileTypeFieldId =
          module.profilesPieChartSettings.groupByProfileTypeFieldId ?? undefined;
        settings.filters =
          isNonNullish(module.profilesPieChartSettings.groupByProfileTypeFieldId) &&
          isNonNullish(module.profilesPieChartSettings.groupByFilter)
            ? [mapProfileFilter(module.profilesPieChartSettings.groupByFilter)]
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
