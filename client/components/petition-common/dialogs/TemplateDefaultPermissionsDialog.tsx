import { gql } from "@apollo/client";
import { Button, Checkbox, Collapse, Flex, FormControl, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
  useSearchUsers,
} from "@parallel/components/common/UserSelect";
import {
  TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment,
  UserOrUserGroupPermissionInput,
} from "@parallel/graphql/__types";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface TemplateDefaultPermissionsDialogData {
  permissions: UserOrUserGroupPermissionInput[];
}

export interface TemplateDefaultPermissionsDialogProps {
  permissions: TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment[];
}

export function TemplateDefaultPermissionsDialog({
  permissions,
  ...props
}: DialogProps<TemplateDefaultPermissionsDialogProps, TemplateDefaultPermissionsDialogData>) {
  const intl = useIntl();

  const editorsRef = useRef<UserSelectInstance<true, true>>(null);
  const { handleSubmit, register, watch, control } = useForm<{
    editors: UserSelectSelection<true>[];
    isSubscribed: boolean;
  }>({
    mode: "onChange",
    defaultValues: {
      editors: permissions.map((p) =>
        p.__typename === "TemplateDefaultUserPermission"
          ? p.user
          : p.__typename === "TemplateDefaultUserGroupPermission"
          ? p.group
          : (null as never)
      ),
      isSubscribed: permissions.length > 0 && permissions[0].isSubscribed,
    },
  });
  const editors = watch("editors");
  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers,
        excludeUserGroups,
        includeGroups: true,
      });
    },
    [_handleSearchUsers]
  );

  return (
    <ConfirmDialog
      size="lg"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(({ editors, isSubscribed }) => {
          props.onResolve({
            permissions: editors.map((x) => ({
              isSubscribed,
              permissionType: "WRITE",
              ...(x.__typename === "User"
                ? { userId: x.id }
                : x.__typename === "UserGroup"
                ? { userGroupId: x.id }
                : (null as never)),
            })),
          });
        }),
      }}
      initialFocusRef={editorsRef}
      header={
        <Text>
          <FormattedMessage
            id="component.template-default-permissions-dialog.title"
            defaultMessage="Share automatically"
          />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.template-default-permissions-dialog.description"
              defaultMessage="Specify the users or teams with whom you want to share the petitions created from this template."
            />
          </Text>
          <FormControl id="editors">
            <Controller
              name="editors"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserSelect
                  ref={editorsRef}
                  isMulti
                  includeGroups
                  value={value}
                  onChange={(users) => onChange(users)}
                  onBlur={onBlur}
                  onSearch={handleSearchUsers}
                  placeholder={intl.formatMessage({
                    id: "generic.petition-sharing-placeholder",
                    defaultMessage: "Add users and teams from your organization",
                  })}
                />
              )}
            />
          </FormControl>
          <Collapse in={editors.length > 0}>
            <FormControl id="is-subscribed">
              <Checkbox {...register("isSubscribed")}>
                <Flex alignItems="center">
                  <Text as="span">
                    <FormattedMessage
                      id="component.template-default-permissions-dialog.subscribe"
                      defaultMessage="Subscribe to notifications"
                    />
                  </Text>
                  <HelpPopover>
                    <FormattedMessage
                      id="component.template-default-permissions-dialog.subscribe-explanation"
                      defaultMessage="These users will be receive notifications from the petitions created from this template."
                    />
                  </HelpPopover>
                </Flex>
              </Checkbox>
            </FormControl>
          </Collapse>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      {...props}
    />
  );
}

TemplateDefaultPermissionsDialog.fragments = {
  PublicPetitionLink: gql`
    fragment TemplateDefaultPermissionsDialog_TemplateDefaultPermission on TemplateDefaultPermission {
      ... on TemplateDefaultUserPermission {
        user {
          ...UserSelect_User
        }
      }
      ... on TemplateDefaultUserGroupPermission {
        group {
          ...UserSelect_UserGroup
        }
      }
      permissionType
      isSubscribed
    }
    ${UserSelect.fragments.User}
    ${UserSelect.fragments.UserGroup}
  `,
};

export function useTemplateDefaultPermissionsDialog() {
  return useDialog(TemplateDefaultPermissionsDialog);
}
