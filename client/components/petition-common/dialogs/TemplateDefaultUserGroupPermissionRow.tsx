import { gql } from "@apollo/client";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon, DeleteIcon, UsersIcon } from "@parallel/chakra/icons";
import { UserGroupMembersPopover } from "@parallel/components/common/UserGroupMembersPopover";
import { TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PetitionPermissionTypeText } from "../PetitionPermissionType";

interface TemplateDefaultUserGroupPermissionRowProps {
  permission: TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragment;
  onRemove?: () => void;
}

export function TemplateDefaultUserGroupPermissionRow({
  permission,
  onRemove,
}: TemplateDefaultUserGroupPermissionRowProps) {
  const { group } = permission;
  return (
    <Flex key={group.id} alignItems="center">
      <Avatar role="presentation" getInitials={() => group.initials} name={group.name} size="sm" />
      <Box flex="1" minWidth={0} fontSize="sm" marginLeft={2}>
        <Stack direction={"row"} spacing={2} align="center">
          <UsersIcon />
          <Text isTruncated>{group.name}</Text>
        </Stack>
        <Flex
          role="group"
          flexDirection="row-reverse"
          justifyContent="flex-end"
          alignItems="center"
        >
          <UserGroupMembersPopover userGroupId={group.id}>
            <Text color="gray.500" cursor="default" isTruncated>
              <FormattedMessage
                id="generic.n-group-members"
                defaultMessage="{count, plural, =1 {1 member} other {# members}}"
                values={{ count: group.memberCount }}
              />
            </Text>
          </UserGroupMembersPopover>
        </Flex>
      </Box>
      <Menu placement="bottom-end">
        <MenuButton as={Button} variant="ghost" size="sm" rightIcon={<ChevronDownIcon />}>
          <PetitionPermissionTypeText type={permission.permissionType} />
        </MenuButton>
        <MenuList minWidth={40}>
          <MenuItem
            color="red.500"
            icon={<DeleteIcon display="block" boxSize={4} />}
            onClick={onRemove}
          >
            <FormattedMessage id="generic.remove" defaultMessage="Remove" />
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}

TemplateDefaultUserGroupPermissionRow.fragments = {
  TemplateDefaultUserGroupPermission: gql`
    fragment TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermission on TemplateDefaultUserGroupPermission {
      permissionType
      group {
        id
        initials
        name
        memberCount
      }
    }
  `,
};
