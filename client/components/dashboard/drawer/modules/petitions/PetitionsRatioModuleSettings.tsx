import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { DashboardModuleRatioFilters } from "../../components/DashboardModuleRatioFilters";
import { PetitionsModuleFilterEditor } from "../../components/PetitionsModuleFilterEditor";
import { Text } from "@parallel/components/ui";

export function PetitionsRatioModuleSettings({ isUpdating }: { isUpdating?: boolean }) {
  const [selectedFilter, setSelectedFilter] = useState<"NUMERATOR" | "DENOMINATOR">("NUMERATOR");
  const { trigger } = useFormContext();
  return (
    <>
      <Text textTransform="uppercase" color="gray.600" fontSize="sm" fontWeight={500}>
        <FormattedMessage id="generic.dashboard-module-filters" defaultMessage="Filters" />:
      </Text>
      <DashboardModuleRatioFilters
        value={selectedFilter}
        onChange={async (filter) => {
          const isValid = await trigger("settings.filters", { shouldFocus: true });
          if (isValid) {
            setSelectedFilter(filter);
          }
        }}
      />

      <PetitionsModuleFilterEditor
        key={selectedFilter}
        field={`settings.filters.${["NUMERATOR", "DENOMINATOR"].indexOf(selectedFilter)}`}
        isUpdating={isUpdating}
      />
    </>
  );
}
