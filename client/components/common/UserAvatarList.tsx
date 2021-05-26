import { gql } from "@apollo/client";
import {
  Avatar,
  Box,
  Flex,
  Stack,
  Text,
  Tooltip,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  UserAvatarList_UserFragment,
  UserAvatarList_UserGroupFragment,
} from "@parallel/graphql/__types";
import { UserListPopover } from "./UserListPopover";

interface UserAvatarListProps {
  users: UserAvatarList_UserFragment[] | UserAvatarList_UserGroupFragment[];
  size?: string;
  max?: number;
}

export const UserAvatarList = Object.assign(
  chakraForwardRef<"div", UserAvatarListProps>(function UserAvatarList(
    { users = [], size = "xs", max = 3 },
    ref
  ) {
    const styles = useMultiStyleConfig("Avatar", { size });
    const slice = users.length === max + 1 ? [...users] : users.slice(0, max);
    slice.reverse();
    const excess =
      users.length > slice.length ? users.length - slice.length : null;

    return (
      <Flex
        ref={ref}
        role="group"
        flexDirection="row-reverse"
        justifyContent="flex-end"
        alignItems="center"
      >
        {excess && (
          <UserListPopover users={users}>
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
          const id = u.id;
          const name =
            u.__typename === "User"
              ? u.fullName
              : u.__typename === "UserGroup"
              ? u.name
              : "";

          const nameElement =
            u.__typename === "User" ? (
              name
            ) : (
              <Stack direction={"row"} spacing={2} align="center">
                <UsersIcon />
                <Text>{name}</Text>
              </Stack>
            );

          return (
            <Tooltip key={id} label={nameElement!} isDisabled={!name}>
              <Box
                paddingY={1}
                marginY={-1}
                marginRight={-2}
                sx={{
                  ":hover > *": {
                    transform: "translateY(-0.25rem)",
                    zIndex: 1,
                  },
                }}
              >
                <Box
                  border="2px solid"
                  borderColor="white"
                  borderRadius="full"
                  transition="transform 150ms ease"
                  position="relative"
                  boxSize={7}
                  overflow="hidden"
                >
                  <Avatar
                    size="xs"
                    name={name ?? undefined}
                    boxSize="100%"
                    borderRadius="none"
                  />
                </Box>
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
            ...UserListPopover_User
          }
          ${UserListPopover.fragments.User}
        `;
      },
      get UserGroup() {
        return gql`
          fragment UserAvatarList_UserGroup on UserGroup {
            id
            name
            members {
              user {
                ...UserAvatarList_User
              }
            }
          }
          ${this.User}
        `;
      },
    },
  }
);
