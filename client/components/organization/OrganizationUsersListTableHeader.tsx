import { gql } from "@apollo/client";
import { Box, Button, Menu, MenuButton, MenuItem, MenuList, Portal, Stack } from "@chakra-ui/react";
import {
  ChevronDownIcon,
  RepeatIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import {
  OrganizationUsersListTableHeader_UserFragment,
  OrganizationUsers_UserFragment,
  UserStatus,
} from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { isAdmin } from "@parallel/utils/roles";
import { FormattedMessage, useIntl } from "react-intl";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type OrganizationUsersListTableHeaderProps = {
  me: OrganizationUsersListTableHeader_UserFragment;
  search: string | null;
  selectedUsers: OrganizationUsers_UserFragment[];
  hasSsoProvider: boolean;
  isCreateUserButtonDisabled?: boolean;
  isActivateUserButtonDisabled?: boolean;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onCreateUser: () => void;
  onUpdateUserStatus: (userIds: string[], status: UserStatus) => void;
};

export function OrganizationUsersListTableHeader({
  me,
  search,
  selectedUsers,
  hasSsoProvider,
  isCreateUserButtonDisabled,
  isActivateUserButtonDisabled,
  onSearchChange,
  onReload,
  onCreateUser,
  onUpdateUserStatus,
}: OrganizationUsersListTableHeaderProps) {
  const intl = useIntl();

  const showActions = selectedUsers.length > 0;

  const showErrorDialog = useErrorDialog();
  const handleUpdateSelectedUsersStatus = async (newStatus: UserStatus) => {
    if (selectedUsers.some((u) => u.id === me.id)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage({
            id: "organization-users.update-user-status.error.deactivate-own-user",
            defaultMessage:
              "You can't deactivate your own user. Please, remove it from the selection and try again.",
          }),
        })
      );
    } else if (selectedUsers.some((u) => u.isSsoUser)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage(
            {
              id: "organization-users.update-user-status.error.update-sso-user",
              defaultMessage:
                "{count, plural, =1{The user you selected is} other{Some of the users you selected are}} managed by a SSO provider. Please, update its status directly on the provider.",
            },
            { count: selectedUsers.length }
          ),
        })
      );
    } else {
      onUpdateUserStatus(
        selectedUsers.map((u) => u.id),
        newStatus
      );
    }
  };

  return (
    <Stack direction="row" padding={2}>
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={(e) => onSearchChange(e.target.value)} />
      </Box>
      <IconButtonWithTooltip
        onClick={onReload}
        icon={<RepeatIcon />}
        placement="bottom"
        variant="outline"
        label={intl.formatMessage({
          id: "generic.reload-data",
          defaultMessage: "Reload",
        })}
      />
      {isAdmin(me) ? (
        <>
          <Spacer />
          <Box>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={!showActions}>
                <FormattedMessage id="generic.actions-button" defaultMessage="Actions" />
              </MenuButton>
              <Portal>
                <MenuList minWidth="160px">
                  <MenuItem
                    isDisabled={
                      selectedUsers.every((u) => u.status === "ACTIVE") ||
                      isActivateUserButtonDisabled
                    }
                    onClick={() => handleUpdateSelectedUsersStatus("ACTIVE")}
                    icon={<UserCheckIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="organization-users.activate"
                      defaultMessage="Activate {count, plural, =1{user} other {users}}"
                      values={{ count: selectedUsers.length }}
                    />
                  </MenuItem>
                  <MenuItem
                    isDisabled={selectedUsers.every((u) => u.status === "INACTIVE")}
                    onClick={() => handleUpdateSelectedUsersStatus("INACTIVE")}
                    icon={<UserXIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="organization-users.deactivate"
                      defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
                      values={{ count: selectedUsers.length }}
                    />
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </Box>
          {hasSsoProvider ? null : (
            <Button
              isDisabled={isCreateUserButtonDisabled}
              colorScheme="purple"
              leftIcon={<UserPlusIcon fontSize="18px" />}
              onClick={onCreateUser}
            >
              <FormattedMessage
                id="components.create-or-update-user-dialog.invite-user"
                defaultMessage="Invite user"
              />
            </Button>
          )}
        </>
      ) : null}
    </Stack>
  );
}

OrganizationUsersListTableHeader.fragments = {
  User: gql`
    fragment OrganizationUsersListTableHeader_User on User {
      id
      role
    }
  `,
};
