import { gql } from "@apollo/client";
import {
  List,
  ListItem,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
} from "@chakra-ui/react";
import { Popover } from "@parallel/chakra/components";
import { UsersIcon } from "@parallel/chakra/icons";
import { Flex, Stack, Text } from "@parallel/components/ui";
import {
  UserListPopover_UserFragment,
  UserListPopover_UserGroupFragment,
} from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { Avatar } from "../ui";
import { UserAvatar } from "./UserAvatar";
import { UserGroupReference } from "./UserGroupReference";

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
          <PopoverBody
            paddingX={0}
            paddingY={2}
            overflow="auto"
            maxHeight="300px"
            maxWidth="320px"
            as={Stack}
          >
            <Stack as={List}>
              {usersOrGroups.map((u) => (
                <Flex key={u.id} as={ListItem} alignItems="center" paddingX={4}>
                  {u.__typename === "User" ? (
                    <>
                      <UserAvatar size="xs" user={u} />
                      <Text flex="1" marginStart={2} lineClamp={1} wordBreak="break-all">
                        {u.fullName}
                      </Text>
                    </>
                  ) : u.__typename === "UserGroup" ? (
                    <>
                      <Avatar.Root
                        size="xs"
                        backgroundColor="gray.200"
                        icon={<UsersIcon boxSize={3.5} />}
                        color="gray.800"
                      />

                      <Text flex="1" marginStart={2} lineClamp={1} wordBreak="break-all">
                        <UserGroupReference userGroup={u} />
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

const _fragments = {
  User: gql`
    fragment UserListPopover_User on User {
      id
      fullName
      ...UserAvatar_User
    }
  `,
  UserGroup: gql`
    fragment UserListPopover_UserGroup on UserGroup {
      id
      initials
      ...UserGroupReference_UserGroup
    }
  `,
};
