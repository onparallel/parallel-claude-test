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
  UserXIcon,
} from "@parallel/chakra/icons";
import {
  AppLayout_UserFragment,
  OrganizationGroups_GroupFragment,
  UserStatus,
} from "@parallel/graphql/__types";
import { If } from "@parallel/utils/conditions";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type OrganizationGroupsListTableHeaderProps = {
  me: AppLayout_UserFragment;
  search: string | null;
  selectedGroups: OrganizationGroups_GroupFragment[];
  hasSsoProvider: boolean;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onCreateGroup: () => void;
  onUpdateGroupStatus: (userIds: string[], status: UserStatus) => void;
};

export function OrganizationGroupsListTableHeader({
  me,
  search,
  selectedGroups,
  onSearchChange,
  onReload,
  onCreateGroup,
  onUpdateGroupStatus,
}: OrganizationGroupsListTableHeaderProps) {
  const intl = useIntl();

  const showActions = selectedGroups.length > 0;

  const handleUpdateselectedGroupsStatus = async (newStatus: UserStatus) => {
    onUpdateGroupStatus(
      selectedGroups.map((u) => u.id),
      newStatus
    );
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
                isDisabled={selectedGroups.every((u) => u.status === "ACTIVE")}
                onClick={() => handleUpdateselectedGroupsStatus("ACTIVE")}
              >
                <UserCheckIcon marginRight={2} />
                <FormattedMessage
                  id="organization-users.activate"
                  defaultMessage="Activate {count, plural, =1{user} other {users}}"
                  values={{ count: selectedGroups.length }}
                />
              </MenuItem>
              <MenuItem
                isDisabled={selectedGroups.every(
                  (u) => u.status === "INACTIVE"
                )}
                onClick={() => handleUpdateselectedGroupsStatus("INACTIVE")}
              >
                <UserXIcon marginRight={2} />
                <FormattedMessage
                  id="organization-users.deactivate"
                  defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
                  values={{ count: selectedGroups.length }}
                />
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Box>
      <If condition={me.isSuperAdmin}>
        <Button colorScheme="purple" onClick={onCreateGroup}>
          <FormattedMessage
            id="organization-groups.create-group"
            defaultMessage="Create group"
          />
        </Button>
      </If>
    </Stack>
  );
}
