import { Text } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { DashboardModuleRatioFilters } from "../../components/DashboardModuleRatioFilters";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";
import { PetitionsFiltersModuleSettings } from "./PetitionsFiltersModuleSettings";

export function PetitionsRatioModuleSettings() {
  const [selectedFilter, setSelectedFilter] = useState(0);
  const { trigger } = useFormContext<DashboardModuleDrawerFormData>();

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
      <DashboardModuleRatioFilters value={selectedFilter} onChange={handleSelectedFilterChange} />
      <PetitionsFiltersModuleSettings key={selectedFilter} index={selectedFilter} />
    </>
  );
}
