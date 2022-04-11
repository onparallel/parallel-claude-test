import { Box, Button, Menu, MenuButton, MenuItem, MenuList, Portal, Stack } from "@chakra-ui/react";
import { ChevronDownIcon, LogInIcon, RepeatIcon } from "@parallel/chakra/icons";
import { OrganizationMembers_OrganizationUserFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { WhenOrgRole } from "../common/WhenOrgRole";

export interface OrganizationMembersListTableHeaderProps {
  search: string | null;
  selectedUsers: OrganizationMembers_OrganizationUserFragment[];
  onSearchChange(value: string | null): void;
  onReload(): void;
  onLoginAs(): void;
}

export function OrganizationMembersListTableHeader({
  search,
  selectedUsers,
  onSearchChange,
  onReload,
  onLoginAs,
}: OrganizationMembersListTableHeaderProps) {
  const intl = useIntl();

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
      <WhenOrgRole role="ADMIN">
        <Spacer />
        <Box>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              isDisabled={selectedUsers.length === 0}
            >
              <FormattedMessage id="generic.actions-button" defaultMessage="Actions" />
            </MenuButton>
            <Portal>
              <MenuList minWidth="160px">
                <MenuItem
                  icon={<LogInIcon display="block" boxSize={4} />}
                  isDisabled={selectedUsers.length !== 1}
                  onClick={onLoginAs}
                >
                  <FormattedMessage id="organization-users.login-as" defaultMessage="Login as..." />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Box>
      </WhenOrgRole>
    </Stack>
  );
}
