import {
  Avatar,
  Flex,
  List,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import {
  UserListPopover_UserFragment,
  UserListPopover_UserGroupFragment,
} from "@parallel/graphql/__types";
import gql from "graphql-tag";
import { ReactNode } from "react";
import { UserAvatar } from "./UserAvatar";

export function UserListPopover({
  usersOrGroups,
  children,
}: {
  usersOrGroups: (UserListPopover_UserFragment | UserListPopover_UserGroupFragment)[];
  children: ReactNode;
}) {
  if (usersOrGroups.length === 0) {
    return <>{children}</>;
  }

  return (
    <Popover trigger="hover">
      <PopoverTrigger>{children}</PopoverTrigger>
      <Portal>
        <PopoverContent width="fit-content">
          <PopoverArrow />
          <PopoverBody paddingX={0} paddingY={2} overflow="auto" maxHeight="300px">
            <Stack as={List}>
              {usersOrGroups.map((u) => (
                <Flex key={u.id} as={ListItem} alignItems="center" paddingX={4}>
                  {u.__typename === "User" ? (
                    <>
                      <UserAvatar size="xs" user={u} />
                      <Text flex="1" marginLeft={2} isTruncated>
                        {u.fullName}
                      </Text>
                    </>
                  ) : u.__typename === "UserGroup" ? (
                    <>
                      <Avatar
                        size="xs"
                        backgroundColor="gray.200"
                        icon={<UsersIcon boxSize={3.5} />}
                      />
                      <Text flex="1" marginLeft={2} isTruncated>
                        {u.name}
                      </Text>
                    </>
                  ) : null}
                </Flex>
              ))}
            </Stack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}

UserListPopover.fragments = {
  get User() {
    return gql`
      fragment UserListPopover_User on User {
        id
        fullName
        ...UserAvatar_User
      }
      ${UserAvatar.fragments.User}
    `;
  },
  get UserGroup() {
    return gql`
      fragment UserListPopover_UserGroup on UserGroup {
        id
        name
        initials
      }
    `;
  },
};
