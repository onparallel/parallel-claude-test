import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { ProfilesRatioModuleSettings_ProfileTypeFragment } from "@parallel/graphql/__types";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { DashboardModuleRatioFilters } from "../../components/DashboardModuleRatioFilters";
import { DashboardModuleDrawerFormData } from "../../DashboardModuleDrawer";
import { ProfilesFiltersModuleSettings } from "./ProfilesFiltersModuleSettings";

export function ProfilesRatioModuleSettings({
  profileType,
  isDisabled,
}: {
  profileType?: ProfilesRatioModuleSettings_ProfileTypeFragment;
  isDisabled?: boolean;
}) {
  const profileTypeFields = profileType?.fields ?? [];
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
