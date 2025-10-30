import { gql } from "@apollo/client";
import { Box, Stack } from "@chakra-ui/react";
import { UserGroupSelect } from "@parallel/components/common/UserGroupSelect";
import { UserSelect_UserGroupFragment } from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ActionMeta } from "react-select";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRow } from "../rows/SettingsRow";

export function PetitionComposeUserAssignmentSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const intl = useIntl();
  const options = field.options as FieldOptions["USER_ASSIGNMENT"];
  const isDisabled = isReadOnly || field.isFixed;

  const _handleSearchUserGroups = useSearchUserGroups();
  const handleSearchUserGroups = useCallback(
    async (search: string, _excludeUserIds: string[], excludeUserGroupIds: string[]) => {
      return await _handleSearchUserGroups(search, {
        excludeIds: excludeUserGroupIds,
        type: ["NORMAL", "INITIAL"],
      });
    },
    [_handleSearchUserGroups],
  );

  const handleChange = (
    allowedUserGroupId: string | null,
    actionMeta: ActionMeta<UserSelect_UserGroupFragment & { isDisabled?: boolean }>,
  ) => {
    switch (actionMeta.action) {
      case "remove-value":
      case "pop-value":
        if (actionMeta.removedValue?.isDisabled) {
          return;
        }
    }

    onFieldEdit(field.id, {
      options: {
        allowedUserGroupId,
      },
    });
  };

  return (
    <Stack spacing={4}>
      <SettingsRow
        controlId="allowed-user-group"
        label={
          <FormattedMessage
            id="component.petition-compose-user-assignment-settings.allowed-user-group-label"
            defaultMessage="Allowed user group"
          />
        }
        description={
          <FormattedMessage
            id="component.petition-compose-user-assignment-settings.allowed-user-group-description"
            defaultMessage="Restrict which users can be assigned by selecting specific user group. If empty, all users will be available."
          />
        }
        isVertical
      >
        <Box flex={1} w="100%" minWidth={0}>
          <UserGroupSelect
            size="sm"
            isClearable
            isMulti={false}
            value={options.allowedUserGroupId ?? null}
            onChange={(value, actionMeta) => handleChange(value?.id ?? null, actionMeta as any)}
            data-section="allowed-user-groups"
            onSearch={handleSearchUserGroups}
            isDisabled={isDisabled}
            placeholder={intl.formatMessage({
              id: "component.petition-compose-user-assignment-settings.allowed-user-groups-placeholder",
              defaultMessage: "All users",
            })}
          />
        </Box>
      </SettingsRow>
    </Stack>
  );
}

PetitionComposeUserAssignmentSettings.fragments = {
  PetitionField: gql`
    fragment PetitionComposeUserAssignmentSettings_PetitionField on PetitionField {
      id
      options
      isFixed
    }
  `,
};
