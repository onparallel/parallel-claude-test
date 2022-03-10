import { gql } from "@apollo/client";
import { Avatar, Box, Flex, Stack, Text, Tooltip, useMultiStyleConfig } from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  UserAvatarList_UserFragment,
  UserAvatarList_UserGroupFragment,
} from "@parallel/graphql/__types";
import { UserAvatar } from "./UserAvatar";
import { UserListPopover } from "./UserListPopover";

interface UserAvatarListProps {
  usersOrGroups: (UserAvatarList_UserFragment | UserAvatarList_UserGroupFragment)[];
  size?: string;
  max?: number;
}

export const UserAvatarList = Object.assign(
  chakraForwardRef<"div", UserAvatarListProps>(function UserAvatarList(
    { usersOrGroups, size = "xs", max = 3 },
    ref
  ) {
    const styles = useMultiStyleConfig("Avatar", { size });
    const slice =
      usersOrGroups.length === max + 1 ? [...usersOrGroups] : usersOrGroups.slice(0, max);
    slice.reverse();
    const excess = usersOrGroups.length > slice.length ? usersOrGroups.length - slice.length : null;

    return (
      <Flex
        ref={ref}
        role="group"
        flexDirection="row-reverse"
        justifyContent="flex-end"
        alignItems="center"
        minWidth="26px"
      >
        {excess && (
          <UserListPopover usersOrGroups={usersOrGroups}>
            <Flex
              alignItems="center"
              fontSize="2xs"
              borderRadius="full"
              paddingLeft="8px"
              sx={styles.excessLabel}
            >
              <Box as="span">+{excess}</Box>
            </Flex>
          </UserListPopover>
        )}
        {slice.map((u) => {
          const tooltipDisabled =
            u.__typename === "User" ? !u.fullName : u.__typename === "UserGroup" ? !u.name : true;

          const label =
            u.__typename === "User" ? (
              u.fullName
            ) : (
              <Stack direction="row" spacing={2} alignItems="center">
                <UsersIcon />
                <Text>{u.__typename === "UserGroup" ? u.name : null}</Text>
              </Stack>
            );

          return (
            <Tooltip key={u.id} label={label} isDisabled={tooltipDisabled}>
              <Box
                marginY={-1}
                marginRight={-2}
                sx={{
                  ":hover > *": {
                    transform: "translateY(-0.25rem)",
                    zIndex: 1,
                  },
                }}
              >
                {u.__typename === "User" ? (
                  <UserAvatar
                    size="xs"
                    user={u}
                    transitionProperty="transform"
                    transitionDuration="150ms"
                    boxSize={7}
                    borderWidth="2px"
                    borderColor="white"
                  />
                ) : u.__typename === "UserGroup" ? (
                  <Avatar
                    size="xs"
                    name={u.name}
                    getInitials={() => u.initials}
                    transitionProperty="transform"
                    transitionDuration="150ms"
                    boxSize={7}
                    borderWidth="2px"
                    borderColor="white"
                  />
                ) : null}
              </Box>
            </Tooltip>
          );
        })}
      </Flex>
    );
  }),
  {
    fragments: {
      get User() {
        return gql`
          fragment UserAvatarList_User on User {
            id
            fullName
            ...UserAvatar_User
            ...UserListPopover_User
          }
          ${UserAvatar.fragments.User}
          ${UserListPopover.fragments.User}
        `;
      },
      get UserGroup() {
        return gql`
          fragment UserAvatarList_UserGroup on UserGroup {
            id
            name
            initials
          }
        `;
      },
    },
  }
);
