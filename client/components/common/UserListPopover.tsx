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

export function UserListPopover({
  users = [],
  userGroups = [],
  children,
}: {
  users?: UserListPopover_UserFragment[];
  userGroups?: UserListPopover_UserGroupFragment[];
  children: ReactNode;
}) {
  const data = [...users, ...userGroups];

  if (data.length === 0) {
    return <>{children}</>;
  }

  return (
    <Popover trigger="hover">
      <PopoverTrigger>{children}</PopoverTrigger>
      <Portal>
        <PopoverContent>
          <PopoverArrow />
          <PopoverBody
            paddingX={0}
            paddingY={2}
            overflow="auto"
            maxHeight="300px"
          >
            <Stack as={List}>
              {data.map((u) => {
                const name =
                  u.__typename === "User"
                    ? u.fullName
                    : u.__typename === "UserGroup"
                    ? u.name
                    : "";

                const avatar =
                  u.__typename === "User" ? (
                    <Avatar size="xs" name={name ?? undefined} />
                  ) : (
                    <Avatar
                      size="xs"
                      bg="gray.200"
                      icon={<UsersIcon boxSize={3.5} />}
                    />
                  );

                return (
                  <Flex
                    key={u.id}
                    as={ListItem}
                    alignItems="center"
                    paddingX={4}
                  >
                    {avatar}
                    <Text flex="1" marginLeft={2} isTruncated>
                      {name}
                    </Text>
                  </Flex>
                );
              })}
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
      }
    `;
  },
  get UserGroup() {
    return gql`
      fragment UserListPopover_UserGroup on UserGroup {
        id
        name
        members {
          user {
            ...UserListPopover_User
          }
        }
      }
      ${this.User}
    `;
  },
};
