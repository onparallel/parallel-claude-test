import { gql } from "@apollo/client";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon, DeleteIcon, UsersIcon } from "@parallel/chakra/icons";
import { SubscribedNotificationsIcon } from "@parallel/components/common/SubscribedNotificationsIcon";
import { UserGroupMembersPopover } from "@parallel/components/common/UserGroupMembersPopover";
import { UserGroupReference } from "@parallel/components/common/UserGroupReference";
import {
  PetitionPermissionTypeRW,
  TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PetitionPermissionTypeText } from "../PetitionPermissionType";

interface TemplateDefaultUserGroupPermissionRowProps {
  permission: TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragment;
  onRemove?: () => void;
  onChange: (permissionId: string, permissionType: PetitionPermissionTypeRW) => void;
}

export function TemplateDefaultUserGroupPermissionRow({
  permission,
  onRemove,
  onChange,
}: TemplateDefaultUserGroupPermissionRowProps) {
  const { group } = permission;
  return (
    <Flex key={group.id} alignItems="center">
      <Avatar
        role="presentation"
        getInitials={() => group.initials}
        name={group.name}
        icon={<UsersIcon />}
        size="sm"
      />
      <Box flex="1" minWidth={0} fontSize="sm" marginStart={2}>
        <Stack direction={"row"} spacing={1} align="center">
          <Text noOfLines={1} wordBreak="break-all">
            <UserGroupReference userGroup={group} />
          </Text>
          {permission.isSubscribed ? <SubscribedNotificationsIcon /> : null}
        </Stack>
        <Flex
          role="group"
          flexDirection="row-reverse"
          justifyContent="flex-end"
          alignItems="center"
        >
          <UserGroupMembersPopover
            userGroupId={group.id}
            userDetails={() => (permission.isSubscribed ? <SubscribedNotificationsIcon /> : null)}
          >
            <Text color="gray.500" cursor="default" noOfLines={1}>
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
          <MenuItem onClick={() => onChange(permission.id, "WRITE")}>
            <PetitionPermissionTypeText type="WRITE" />
          </MenuItem>
          <MenuItem onClick={() => onChange(permission.id, "READ")}>
            <PetitionPermissionTypeText type="READ" />
          </MenuItem>
          <MenuDivider />
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
      id
      permissionType
      group {
        id
        initials
        name
        memberCount
        ...UserGroupReference_UserGroup
      }
      isSubscribed
    }
    ${UserGroupReference.fragments.UserGroup}
  `,
};
