import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  RepeatIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import {
  AppLayout_UserFragment,
  OrganizationUsers_UserFragment,
  UserStatus,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { useErrorDialog } from "../common/ErrorDialog";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type OrganizationUsersListTableHeaderProps = {
  me: AppLayout_UserFragment;
  search: string | null;
  selectedUsers: OrganizationUsers_UserFragment[];
  hasSsoProvider: boolean;
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
      try {
        await showErrorDialog({
          message: intl.formatMessage({
            id: "organization-users.update-user-status.error",
            defaultMessage:
              "You can't deactivate your own user. Please, remove it from the selection and try again.",
          }),
        });
      } catch {}
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
        <SearchInput
          value={search ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
        />
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
      <Spacer />
      <Box>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            isDisabled={!showActions}
          >
            <FormattedMessage
              id="generic.actions-button"
              defaultMessage="Actions"
            />
          </MenuButton>
          <Portal>
            <MenuList minWidth="160px">
              <MenuItem
                isDisabled={selectedUsers.every((u) => u.status === "ACTIVE")}
                onClick={() => handleUpdateSelectedUsersStatus("ACTIVE")}
              >
                <UserCheckIcon marginRight={2} />
                <FormattedMessage
                  id="organization-users.activate"
                  defaultMessage="Activate {count, plural, =1{user} other {users}}"
                  values={{ count: selectedUsers.length }}
                />
              </MenuItem>
              <MenuItem
                isDisabled={selectedUsers.every((u) => u.status === "INACTIVE")}
                onClick={() => handleUpdateSelectedUsersStatus("INACTIVE")}
              >
                <UserXIcon marginRight={2} />
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
          colorScheme="purple"
          leftIcon={<UserPlusIcon fontSize="18px" />}
          onClick={onCreateUser}
        >
          <FormattedMessage
            id="organization-users.create-user"
            defaultMessage="Create user"
          />
        </Button>
      )}
    </Stack>
  );
}
