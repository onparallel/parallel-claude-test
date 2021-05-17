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
import { UserListPopover_UserFragment } from "@parallel/graphql/__types";
import gql from "graphql-tag";
import { ReactNode } from "react";

export function UserListPopover({
  users,
  children,
}: {
  users: UserListPopover_UserFragment[];
  children: ReactNode;
}) {
  if (users.length === 0) {
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
              {users.map((user) => (
                <Flex
                  key={user.id}
                  as={ListItem}
                  alignItems="center"
                  paddingX={4}
                >
                  <Avatar size="xs" name={user.fullName ?? undefined} />
                  <Text flex="1" marginLeft={2} isTruncated>
                    {user.fullName}
                  </Text>
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
  User: gql`
    fragment UserListPopover_User on User {
      id
      fullName
    }
  `,
};
