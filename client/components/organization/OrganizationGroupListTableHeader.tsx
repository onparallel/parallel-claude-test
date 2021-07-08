import { gql } from "@apollo/client";
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
import { OrganizationGroupListTableHeader_UserFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type OrganizationGroupListTableHeaderProps = {
  me: OrganizationGroupListTableHeader_UserFragment;
  search: string | null;
  selectedMembers: any[];
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onAddMember: () => void;
  onRemoveMember: () => void;
};

export function OrganizationGroupListTableHeader({
  me,
  search,
  selectedMembers,
  onSearchChange,
  onReload,
  onAddMember,
  onRemoveMember,
}: OrganizationGroupListTableHeaderProps) {
  const intl = useIntl();
  const showActions = selectedMembers.length > 0;

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
      {me.role === "ADMIN" ? (
        <>
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
                    onClick={() => onRemoveMember()}
                    color="red.500"
                    icon={<UserXIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="organization-groups.remove-from-group"
                      defaultMessage="Remove from group"
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
        </>
      ) : null}
    </Stack>
  );
}

OrganizationGroupListTableHeader.fragments = {
  User: gql`
    fragment OrganizationGroupListTableHeader_User on User {
      id
      role
    }
  `,
};
