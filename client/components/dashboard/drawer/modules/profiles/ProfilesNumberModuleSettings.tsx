import { gql } from "@apollo/client";

import { Text } from "@parallel/components/ui";
import { ProfilesNumberModuleSettings_ProfileTypeFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { ProfilesModuleFilterEditor } from "../../components/ProfilesModuleFilterEditor";

export function ProfilesNumberModuleSettings({
  profileType,
  isDisabled,
  isUpdating,
}: {
  profileType?: ProfilesNumberModuleSettings_ProfileTypeFragment;
  isDisabled?: boolean;
  isUpdating?: boolean;
}) {
  const profileTypeFields = profileType?.fields ?? [];

  return (
    <>
      <Text textTransform="uppercase" color="gray.600" fontSize="sm" fontWeight={500}>
        <FormattedMessage id="generic.dashboard-module-filters" defaultMessage="Filters" />:
      </Text>
      <ProfilesModuleFilterEditor
        field="settings.filters.0"
        profileTypeFields={profileTypeFields}
        isDisabled={isDisabled}
        isUpdating={isUpdating}
      />
    </>
  );
}

const _fragments = {
  ProfileType: gql`
    fragment ProfilesNumberModuleSettings_ProfileType on ProfileType {
      id
      fields {
        id
        ...ProfilesModuleFilterEditor_ProfileTypeField
      }
    }
  `,
};
