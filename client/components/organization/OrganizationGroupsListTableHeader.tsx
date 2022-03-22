import { Box, Button, Menu, MenuButton, MenuItem, MenuList, Portal, Stack } from "@chakra-ui/react";
import { ChevronDownIcon, CopyIcon, DeleteIcon, RepeatIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { WhenOrgRole } from "../common/WhenOrgRole";

export type OrganizationGroupsListTableHeaderProps = {
  search: string | null;
  selectedGroups: any[];
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onCreateGroup: () => void;
  onCloneGroup: () => void;
  onRemoveGroup: () => void;
};

export function OrganizationGroupsListTableHeader({
  search,
  selectedGroups,
  onSearchChange,
  onReload,
  onCreateGroup,
  onCloneGroup,
  onRemoveGroup,
}: OrganizationGroupsListTableHeaderProps) {
  const intl = useIntl();

  const showActions = selectedGroups.length > 0;

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
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={!showActions}>
              <FormattedMessage id="generic.actions-button" defaultMessage="Actions" />
            </MenuButton>
            <Portal>
              <MenuList minWidth="160px">
                <MenuItem
                  onClick={() => onCloneGroup()}
                  icon={<CopyIcon display="block" boxSize={4} />}
                >
                  <FormattedMessage
                    id="organization-groups.clone-group"
                    defaultMessage="Clone {count, plural, =1{team} other {teams}}"
                    values={{ count: selectedGroups.length }}
                  />
                </MenuItem>
                <MenuItem
                  onClick={() => onRemoveGroup()}
                  color="red.500"
                  icon={<DeleteIcon display="block" boxSize={4} />}
                >
                  <FormattedMessage
                    id="organization-groups.delete-group"
                    defaultMessage="Delete {count, plural, =1{team} other {teams}}"
                    values={{ count: selectedGroups.length }}
                  />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Box>
        <Button colorScheme="purple" onClick={onCreateGroup}>
          <FormattedMessage id="organization-groups.create-group" defaultMessage="Create team" />
        </Button>
      </WhenOrgRole>
    </Stack>
  );
}
