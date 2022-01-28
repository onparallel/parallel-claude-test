import { Box, Button, Flex, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { ChevronDownIcon, DeleteIcon, UserArrowIcon, UserIcon } from "@parallel/chakra/icons";
import { UserAvatar } from "@parallel/components/common/UserAvatar";
import { PetitionPermissionTypeText } from "../PetitionPermissionType";
import { FormattedMessage } from "react-intl";
import {
  PetitionPermissionRow_UserFragment,
  PetitionPermissionType,
} from "@parallel/graphql/__types";
import { gql } from "@apollo/client";

interface PetitionPermissionRowProps {
  user?: PetitionPermissionRow_UserFragment;
  permissionType?: PetitionPermissionType;
}

export function PetitionPermissionRow({
  user,
  permissionType = "OWNER",
}: PetitionPermissionRowProps) {
  return (
    <Flex alignItems="center">
      <UserAvatar
        {...(!user && { backgroundColor: "gray.200", icon: <UserIcon fontSize="md" /> })}
        user={user ?? {}}
        role="presentation"
        size="sm"
      />
      <Box flex="1" minWidth={0} fontSize="sm" marginLeft={2}>
        {user ? (
          <>
            <Text isTruncated>{user.fullName}</Text>
            <Text color="gray.500" isTruncated>
              {user.email}
            </Text>
          </>
        ) : (
          <FormattedMessage
            id="component.petition-permission-row.default-owner"
            defaultMessage="User starting the petition"
          />
        )}
      </Box>

      {permissionType === "OWNER" ? (
        <Box
          paddingX={3}
          fontWeight="bold"
          fontStyle="italic"
          fontSize="sm"
          color="gray.500"
          cursor="default"
        >
          <PetitionPermissionTypeText type={permissionType} />
        </Box>
      ) : (
        <Menu placement="bottom-end">
          <MenuButton as={Button} variant="ghost" size="sm" rightIcon={<ChevronDownIcon />}>
            <PetitionPermissionTypeText type="WRITE" />
          </MenuButton>
          <MenuList minWidth={40}>
            <MenuItem onClick={() => {}} icon={<UserArrowIcon display="block" boxSize={4} />}>
              <FormattedMessage
                id="generic.transfer-ownership"
                defaultMessage="Transfer ownership"
              />
            </MenuItem>
            <MenuItem color="red.500" icon={<DeleteIcon display="block" boxSize={4} />}>
              <FormattedMessage id="generic.remove" defaultMessage="Remove" />
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </Flex>
  );
}

PetitionPermissionRow.fragments = {
  User: gql`
    fragment PetitionPermissionRow_User on User {
      fullName
      email
      ...UserAvatar_User
    }
    ${UserAvatar.fragments.User}
  `,
};
