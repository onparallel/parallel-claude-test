import { useApolloClient } from "@apollo/client";
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
  OrganizationUsers_UserFragmentDoc,
  UserStatus,
} from "@parallel/graphql/__types";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useErrorDialog } from "../common/ErrorDialog";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type OrganizationUsersListTableHeaderProps = {
  me: AppLayout_UserFragment;
  search: string | null;
  selected: string[];
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onCreateUser: () => void;
  onUpdateUserStatus: (userIds: string[], status: UserStatus) => void;
};

export function OrganizationUsersListTableHeader({
  me,
  search: _search,
  selected,
  onSearchChange,
  onReload,
  onCreateUser,
  onUpdateUserStatus,
}: OrganizationUsersListTableHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(_search ?? "");

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  const apolloCache = useApolloClient();
  const selectedUsers = useMemo<OrganizationUsers_UserFragment[]>(
    () =>
      selected.map((userId) =>
        apolloCache.readFragment({
          fragment: OrganizationUsers_UserFragmentDoc,
          id: userId,
        })
      ) as any[],
    [selected]
  );

  const showActions = selected.length > 0;
  const showErrorDialog = useErrorDialog();
  const handleUpdateUserStatus = async (
    userIds: string[],
    newStatus: UserStatus
  ) => {
    if (userIds.includes(me.id)) {
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
      onUpdateUserStatus(userIds, newStatus);
    }
  };

  return (
    <Stack direction="row" padding={2}>
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={handleSearchChange} />
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
                onClick={() => handleUpdateUserStatus(selected, "ACTIVE")}
              >
                <UserCheckIcon marginRight={2} />
                <FormattedMessage
                  id="organization-users.activate"
                  defaultMessage="Activate {count, plural, =1{user} other {users}}"
                  values={{ count: selected.length }}
                />
              </MenuItem>
              <MenuItem
                isDisabled={selectedUsers.every((u) => u.status === "INACTIVE")}
                onClick={() => handleUpdateUserStatus(selected, "INACTIVE")}
              >
                <UserXIcon marginRight={2} />
                <FormattedMessage
                  id="organization-users.deactivate"
                  defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
                  values={{ count: selected.length }}
                />
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Box>
      <Button
        colorScheme="purple"
        leftIcon={<UserPlusIcon fontSize="18px" />}
        onClick={onCreateUser}
      >
        {intl.formatMessage({
          id: "organization.create-user",
          defaultMessage: "Create user",
        })}
      </Button>
    </Stack>
  );
}
