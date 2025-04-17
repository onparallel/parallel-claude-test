import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { ProfilesRatioModuleSettings_ProfileTypeFragment } from "@parallel/graphql/__types";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNullish } from "remeda";
import { DashboardModuleRatioFilters } from "../../components/DashboardModuleRatioFilters";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";
import { ProfilesFiltersModuleSettings } from "./ProfilesFiltersModuleSettings";

const isFilterActive = (value: any): boolean => {
  if (isNullish(value)) return false;
  if (Array.isArray(value)) return (value as any[]).length > 0;
  if (typeof value === "object")
    return (
      Object.keys(value).length > 0 && "conditions" in value && (value as any).conditions.length > 0
    );
  return true;
};

export function ProfilesRatioModuleSettings({
  profileType,
  isDisabled,
}: {
  profileType?: ProfilesRatioModuleSettings_ProfileTypeFragment;
  isDisabled?: boolean;
}) {
  const profileTypeFields = profileType?.fields ?? [];
  const [selectedFilter, setSelectedFilter] = useState(0);
  const { trigger, watch } = useFormContext<DashboardModuleDrawerFormData>();
  const handleSelectedFilterChange = async (index: number) => {
    const isValid = await trigger("settings.filters", { shouldFocus: true });
    if (isValid) {
      setSelectedFilter(index);
    }
  };
  const filters = watch("settings.filters");
  const filterA = filters?.[0] ?? {};
  const filterB = filters?.[1] ?? {};

  const activeFiltersA = Object.values(filterA).filter(isFilterActive);
  const activeFiltersB = Object.values(filterB).filter(isFilterActive);
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
      <ProfilesFiltersModuleSettings
        key={selectedFilter}
        index={selectedFilter}
        profileTypeFields={profileTypeFields}
        isDisabled={isDisabled}
      />
    </>
  );
}

ProfilesRatioModuleSettings.fragments = {
  ProfileType: gql`
    fragment ProfilesRatioModuleSettings_ProfileType on ProfileType {
      id
      fields {
        id
        ...ProfilesFiltersModuleSettings_ProfileTypeField
      }
    }
    ${ProfilesFiltersModuleSettings.fragments.ProfileTypeField}
  `,
};
