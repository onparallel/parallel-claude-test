import { gql } from "@apollo/client";

import { ProfilesRatioModuleSettings_ProfileTypeFragment } from "@parallel/graphql/__types";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { DashboardModuleRatioFilters } from "../../components/DashboardModuleRatioFilters";
import { ProfilesModuleFilterEditor } from "../../components/ProfilesModuleFilterEditor";
import { Text } from "@parallel/components/ui";

export function ProfilesRatioModuleSettings({
  profileType,
  isDisabled,
  isUpdating,
}: {
  profileType?: ProfilesRatioModuleSettings_ProfileTypeFragment;
  isDisabled?: boolean;
  isUpdating?: boolean;
}) {
  const profileTypeFields = profileType?.fields ?? [];
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

      <ProfilesModuleFilterEditor
        key={selectedFilter}
        field={`settings.filters.${["NUMERATOR", "DENOMINATOR"].indexOf(selectedFilter)}`}
        profileTypeFields={profileTypeFields}
        isDisabled={isDisabled}
        isUpdating={isUpdating}
      />
    </>
  );
}

const _fragments = {
  ProfileType: gql`
    fragment ProfilesRatioModuleSettings_ProfileType on ProfileType {
      id
      fields {
        id
        ...ProfilesModuleFilterEditor_ProfileTypeField
      }
    }
  `,
};
