import { gql } from "@apollo/client";
import { FormControl, FormHelperText, FormLabel } from "@chakra-ui/react";
import { UserGroupSelect } from "@parallel/components/common/UserGroupSelect";
import { UserSelect_UserGroupFragment } from "@parallel/graphql/__types";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { Stack } from "@parallel/components/ui";
import { useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { ActionMeta } from "react-select";
import { CreateOrUpdateProfileTypeFieldDialogFormData } from "../dialogs/CreateOrUpdateProfileTypeFieldDialog";

export function ProfileFieldUserAssignmentSettings() {
  const intl = useIntl();
  const { control } = useFormContext<CreateOrUpdateProfileTypeFieldDialogFormData>();
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
  return (
    <Stack gap={4}>
      <Controller
        control={control}
        name="options.allowedUserGroupId"
        render={({ field }) => (
          <FormControl>
            <FormLabel>
              <FormattedMessage
                id="component.profile-field-user-assignment-settings.allowed-user-group"
                defaultMessage="Allowed user group"
              />
            </FormLabel>
            <UserGroupSelect
              isMulti={false}
              isClearable
              value={field.value ?? null}
              onChange={(
                userGroup,
                actionMeta: ActionMeta<UserSelect_UserGroupFragment & { isDisabled?: boolean }>,
              ) => {
                switch (actionMeta.action) {
                  case "remove-value":
                  case "pop-value":
                    if (actionMeta.removedValue?.isDisabled) {
                      return;
                    }
                }
                field.onChange(userGroup?.id ?? null);
              }}
              data-section="add-user-to-groups"
              onBlur={field.onBlur}
              onSearch={handleSearchUserGroups}
              placeholder={intl.formatMessage({
                id: "component.profile-field-user-assignment-settings.allowed-user-group-placeholder",
                defaultMessage: "Select user group",
              })}
            />
            <FormHelperText>
              <FormattedMessage
                id="component.profile-field-user-assignment-settings.allowed-user-group-help"
                defaultMessage="Limit which users can be selected by filtering by user group. If empty, all users in the organization will be available."
              />
            </FormHelperText>
          </FormControl>
        )}
      />
    </Stack>
  );
}

const _fragments = {
  ProfileTypeField: gql`
    fragment ProfileFieldUserAssignmentSettings_ProfileTypeField on ProfileTypeField {
      id
      options
    }
  `,
};

const _queries = [
  gql`
    query ProfileFieldUserAssignmentSettings_UserGroups {
      userGroups {
        items {
          id
          name
        }
      }
    }
  `,
];
