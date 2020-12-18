import { gql } from "@apollo/client";
import {
  Avatar,
  Box,
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
  Tooltip,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { UserAvatarList_UserFragment } from "@parallel/graphql/__types";

interface UserAvatarListProps {
  users: UserAvatarList_UserFragment[];
  size?: string;
}

export const UserAvatarList = Object.assign(
  chakraForwardRef<"div", UserAvatarListProps>(function UserAvatarList(
    { users, size = "xs" },
    ref
  ) {
    const styles = useMultiStyleConfig("Avatar", { size });
    const max = 3;
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
          <Popover trigger="hover">
            <PopoverTrigger>
              <Flex
                alignItems="center"
                fontSize="2xs"
                borderRadius="full"
                paddingLeft="8px"
                sx={styles.excessLabel}
              >
                <Box as="span">+{excess}</Box>
              </Flex>
            </PopoverTrigger>
            <Portal>
              <PopoverContent width="200px" maxWidth="200px">
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
                        <Avatar size="sm" name={user.fullName ?? undefined} />
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
        )}
        {slice.map(({ id, fullName }) => (
          <Tooltip key={id} label={fullName!} isDisabled={!fullName}>
            <Box
              paddingY={1}
              marginY={-1}
              marginRight={-2}
              sx={{
                ":hover > *": {
                  transform: "translateY(-0.25rem)",
                  borderColor: "purple.500",
                  zIndex: 2,
                },
              }}
            >
              <Box
                border="2px solid"
                borderColor="white"
                borderRadius="full"
                transition="transform 150ms ease"
                position="relative"
                zIndex={1}
              >
                <Avatar size="xs" name={fullName ?? undefined} />
              </Box>
            </Box>
          </Tooltip>
        ))}
      </Flex>
    );
  }),
  {
    fragments: {
      User: gql`
        fragment UserAvatarList_User on User {
          id
          fullName
        }
      `,
    },
  }
);
