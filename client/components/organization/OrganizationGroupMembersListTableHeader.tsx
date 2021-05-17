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
  UserPlusIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import {
  AppLayout_UserFragment,
  OrganizationUsers_UserFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type OrganizationGroupMembersListTableHeaderProps = {
  me: AppLayout_UserFragment;
  search: string | null;
  selectedUsers: OrganizationUsers_UserFragment[];
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onAddMember: () => void;
  onRemoveMember: (userIds: OrganizationUsers_UserFragment[]) => void;
};

export function OrganizationGroupMembersListTableHeader({
  me,
  search,
  selectedUsers,
  onSearchChange,
  onReload,
  onAddMember,
  onRemoveMember,
}: OrganizationGroupMembersListTableHeaderProps) {
  const intl = useIntl();
  const showActions = selectedUsers.length > 0;

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
                onClick={() => onRemoveMember(selectedUsers)}
                color="red.500"
              >
                <UserXIcon marginRight={2} />
                <FormattedMessage
                  id="organization-groups.remove-from-group"
                  defaultMessage="Remove from group"
                  values={{ count: selectedUsers.length }}
                />
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Box>
      <Button
        colorScheme="purple"
        leftIcon={<UserPlusIcon fontSize="18px" />}
        onClick={onAddMember}
      >
        <FormattedMessage
          id="organization-groups.add-member"
          defaultMessage="Add member"
        />
      </Button>
    </Stack>
  );
}
