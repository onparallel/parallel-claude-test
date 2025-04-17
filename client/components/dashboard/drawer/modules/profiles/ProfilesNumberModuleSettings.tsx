import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { ProfilesNumberModuleSettings_ProfileTypeFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { ProfilesFiltersModuleSettings } from "./ProfilesFiltersModuleSettings";

export function ProfilesNumberModuleSettings({
  profileType,
  isDisabled,
}: {
  profileType?: ProfilesNumberModuleSettings_ProfileTypeFragment;
  isDisabled?: boolean;
}) {
  const profileTypeFields = profileType?.fields ?? [];

  return (
    <>
      <Divider />
      <Text fontWeight={600}>
        <FormattedMessage id="component.dashboard-module-form.filters" defaultMessage="Filters" />:
      </Text>
      <ProfilesFiltersModuleSettings
        profileTypeFields={profileTypeFields}
        isDisabled={isDisabled}
      />
    </>
  );
}

ProfilesNumberModuleSettings.fragments = {
  ProfileType: gql`
    fragment ProfilesNumberModuleSettings_ProfileType on ProfileType {
      id
      fields {
        id
        ...ProfilesFiltersModuleSettings_ProfileTypeField
      }
    }
    ${ProfilesFiltersModuleSettings.fragments.ProfileTypeField}
  `,
};
