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
import { ChevronDownIcon, DeleteIcon, UserArrowIcon, UserIcon } from "@parallel/chakra/icons";
import { SubscribedNotificationsIcon } from "@parallel/components/common/SubscribedNotificationsIcon";
import { UserAvatar } from "@parallel/components/common/UserAvatar";
import {
  PetitionPermissionTypeRW,
  TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { PetitionPermissionTypeText } from "../PetitionPermissionType";

interface TemplateDefaultUserPermissionRowProps {
  permission?: TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragment;
  onRemove?: () => void;
  onTransfer?: () => void;
  onChange?: (permissionId: string, permissionType: PetitionPermissionTypeRW) => void;
  userId: string;
  isSubscribed?: boolean;
}

export function TemplateDefaultUserPermissionRow({
  permission,
  userId,
  onRemove,
  onTransfer,
  onChange,
  isSubscribed,
}: TemplateDefaultUserPermissionRowProps) {
  return (
    <Flex alignItems="center">
      {isDefined(permission) ? (
        <UserAvatar user={permission?.user ?? {}} role="presentation" size="sm" />
      ) : (
        <Avatar
          backgroundColor="gray.200"
          icon={<UserIcon fontSize="md" />}
          role="presentation"
          size="sm"
          color="gray.800"
        />
      )}

      <Box flex="1" minWidth={0} fontSize="sm" marginStart={2}>
        {isDefined(permission) ? (
          <>
            <Stack direction={"row"} spacing={1} align="center">
              <Text noOfLines={1} wordBreak="break-all">
                {permission.user.fullName}{" "}
                {userId === permission.user.id ? (
                  <Text as="span">
                    {"("}
                    <FormattedMessage id="generic.you" defaultMessage="You" />
                    {")"}
                  </Text>
                ) : null}
              </Text>
              {isSubscribed ? <SubscribedNotificationsIcon /> : null}
            </Stack>
            <Text color="gray.500" noOfLines={1}>
              {permission.user.email}
            </Text>
          </>
        ) : (
          <FormattedMessage
            id="component.petition-permission-row.default-owner"
            defaultMessage="Person starting the parallel"
          />
        )}
      </Box>
      {isDefined(permission) ? (
        <Menu placement="bottom-end">
          <MenuButton as={Button} variant="ghost" size="sm" rightIcon={<ChevronDownIcon />}>
            <PetitionPermissionTypeText type={permission.permissionType} />
          </MenuButton>
          <MenuList minWidth={40}>
            <MenuItem onClick={() => onChange?.(permission.id, "WRITE")}>
              <PetitionPermissionTypeText type="WRITE" />
            </MenuItem>
            <MenuItem onClick={() => onChange?.(permission.id, "READ")}>
              <PetitionPermissionTypeText type="READ" />
            </MenuItem>
            <MenuDivider />
            <MenuItem
              isDisabled={permission.permissionType === "OWNER"}
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
      ) : (
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
      )}
    </Flex>
  );
}

TemplateDefaultUserPermissionRow.fragments = {
  TemplateDefaultUserPermission: gql`
    fragment TemplateDefaultUserPermissionRow_TemplateDefaultUserPermission on TemplateDefaultUserPermission {
      id
      permissionType
      user {
        id
        fullName
        email
        ...UserAvatar_User
      }
      isSubscribed
    }
    ${UserAvatar.fragments.User}
  `,
};
