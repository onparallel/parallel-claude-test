import { gql } from "@apollo/client";
import { Box, Flex, useMultiStyleConfig } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { UsersIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  UserAvatarList_UserFragment,
  UserAvatarList_UserGroupFragment,
} from "@parallel/graphql/__types";
import { Avatar, AvatarRootProps } from "../ui";
import { UserAvatar } from "./UserAvatar";
import { UserGroupReference } from "./UserGroupReference";
import { UserListPopover } from "./UserListPopover";

interface UserAvatarListProps {
  usersOrGroups: (UserAvatarList_UserFragment | UserAvatarList_UserGroupFragment)[];
  size?: AvatarRootProps["size"];
  max?: number;
  boxSize?: number;
}

export const UserAvatarList = Object.assign(
  chakraForwardRef<"div", UserAvatarListProps>(function UserAvatarList(
    { usersOrGroups, size = "xs", max = 3, boxSize = 7 },
    ref,
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
              marginX={0.5}
              alignItems="center"
              fontSize="2xs"
              borderRadius="full"
              paddingStart="8px"
              sx={{ ...styles.label, ...styles.excessLabel }}
            >
              <Box as="span">+{excess}</Box>
            </Flex>
          </UserListPopover>
        )}
        {slice.map((u, i) => {
          const label =
            u.__typename === "User" ? (
              u.fullName
            ) : u.__typename === "UserGroup" ? (
              <UserGroupReference userGroup={u} fontWeight="normal" />
            ) : (
              (null as never)
            );

          return (
            <Tooltip key={u.id} label={label}>
              <Box
                marginY={-1}
                marginEnd={i === 0 && !excess ? 0 : -2}
                sx={{
                  ":hover > *": {
                    transform: "translateY(-0.25rem)",
                    zIndex: 1,
                  },
                }}
              >
                {u.__typename === "User" ? (
                  <UserAvatar
                    size={size}
                    user={u}
                    transitionProperty="transform"
                    transitionDuration="150ms"
                    boxSize={boxSize}
                    borderWidth="2px"
                    borderColor="white"
                  />
                ) : u.__typename === "UserGroup" ? (
                  <Avatar.Root
                    size={size}
                    icon={<UsersIcon />}
                    getInitials={() => u.initials}
                    transitionProperty="transform"
                    transitionDuration="150ms"
                    boxSize={boxSize}
                    borderWidth="2px"
                    borderColor="white"
                  >
                    <Avatar.Fallback name={u.name} />
                  </Avatar.Root>
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
            initials
            ...UserGroupReference_UserGroup
          }
          ${UserGroupReference.fragments.UserGroup}
        `;
      },
    },
  },
);
