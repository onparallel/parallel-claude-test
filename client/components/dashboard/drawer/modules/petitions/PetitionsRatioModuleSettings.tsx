import { Text } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { DashboardModuleRatioFilters } from "../../components/DashboardModuleRatioFilters";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";
import { PetitionsFiltersModuleSettings } from "./PetitionsFiltersModuleSettings";

const isFilterActive = (value: any): boolean => {
  if (isNonNullish(value)) {
    if (typeof value === "object") {
      // For complex filters
      if ("filters" in value && Array.isArray((value as any).filters)) {
        return (value as any).filters.length > 0;
      }

      // For simple objects
      return Object.values(value).some((v) => isFilterActive(v));
    }

    if (typeof value === "string") return value.trim() !== "";

    if (Array.isArray(value)) return value.length > 0;

    return true;
  } else {
    return false;
  }
};

export function PetitionsRatioModuleSettings() {
  const [selectedFilter, setSelectedFilter] = useState(0);
  const { watch, trigger } = useFormContext<DashboardModuleDrawerFormData>();
  const filters = watch("settings.filters");
  const filterA = filters?.[0] ?? {};
  const filterB = filters?.[1] ?? {};

  const activeFiltersA = Object.values(filterA).filter(isFilterActive);
  const activeFiltersB = Object.values(filterB).filter(isFilterActive);

  const handleSelectedFilterChange = async (index: number) => {
    const isValid = await trigger("settings.filters", { shouldFocus: true });
    if (isValid) {
      setSelectedFilter(index);
    }
  };
  return (
    <>
      <Divider />
      <Text fontWeight={600}>
        <FormattedMessage id="component.dashboard-module-form.filters" defaultMessage="Filters" />:
      </Text>
      <DashboardModuleRatioFilters
        filtersCount={[activeFiltersA.length, activeFiltersB.length]}
        value={selectedFilter}
        onChange={handleSelectedFilterChange}
      />
      <PetitionsFiltersModuleSettings key={selectedFilter} index={selectedFilter} />
    </>
  );
}
