import { gql } from "@apollo/client";
import { Box, Button, Flex, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { ChevronDownIcon, DeleteIcon, UserArrowIcon, UserIcon } from "@parallel/chakra/icons";
import { UserAvatar } from "@parallel/components/common/UserAvatar";
import { UserSelect } from "@parallel/components/common/UserSelect";
import {
  PetitionPermissionType,
  TemplateDefaultUserPermissionRow_UserFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PetitionPermissionTypeText } from "../PetitionPermissionType";

interface TemplateDefaultUserPermissionRowProps {
  user?: TemplateDefaultUserPermissionRow_UserFragment;
  permissionType?: PetitionPermissionType;
  onRemove?: () => void;
  onTransfer?: () => void;
  userId: string;
}

export function TemplateDefaultUserPermissionRow({
  user,
  permissionType,
  userId,
  onRemove,
  onTransfer,
}: TemplateDefaultUserPermissionRowProps) {
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
            <Text isTruncated>
              {user.fullName}{" "}
              {userId === user.id ? (
                <Text as="span">
                  {"("}
                  <FormattedMessage id="generic.you" defaultMessage="You" />
                  {")"}
                </Text>
              ) : null}
            </Text>
            <Text color="gray.500" isTruncated>
              {user.email}
            </Text>
          </>
        ) : (
          <FormattedMessage
            id="component.petition-permission-row.default-owner"
            defaultMessage="Person starting the petition"
          />
        )}
      </Box>
      {!user ? (
        <Box
          paddingX={3}
          fontWeight="bold"
          fontStyle="italic"
          fontSize="sm"
          color="gray.500"
          cursor="default"
        >
          <PetitionPermissionTypeText type="OWNER" />
        </Box>
      ) : permissionType ? (
        <Menu placement="bottom-end">
          <MenuButton as={Button} variant="ghost" size="sm" rightIcon={<ChevronDownIcon />}>
            <PetitionPermissionTypeText type={permissionType} />
          </MenuButton>
          <MenuList minWidth={40}>
            <MenuItem
              isDisabled={permissionType === "OWNER"}
              icon={<UserArrowIcon display="block" boxSize={4} />}
              onClick={onTransfer}
            >
              <FormattedMessage
                id="generic.transfer-ownership"
                defaultMessage="Transfer ownership"
              />
            </MenuItem>
            <MenuItem
              color="red.500"
              icon={<DeleteIcon display="block" boxSize={4} />}
              onClick={onRemove}
            >
              <FormattedMessage id="generic.remove" defaultMessage="Remove" />
            </MenuItem>
          </MenuList>
        </Menu>
      ) : null}
    </Flex>
  );
}

TemplateDefaultUserPermissionRow.fragments = {
  get User() {
    return gql`
      fragment TemplateDefaultUserPermissionRow_User on User {
        id
        fullName
        email
        ...UserSelect_User
        ...UserAvatar_User
      }
      ${UserSelect.fragments.User}
      ${UserAvatar.fragments.User}
    `;
  },
  get TemplateDefaultUserPermission() {
    return gql`
      fragment TemplateDefaultUserPermissionRow_TemplateDefaultUserPermission on TemplateDefaultUserPermission {
        id
        permissionType
        user {
          ...TemplateDefaultUserPermissionRow_User
        }
      }
      ${this.User}
    `;
  },
};
