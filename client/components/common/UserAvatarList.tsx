import {
  AvatarGroup,
  Avatar,
  Tooltip,
  Stack,
  Flex,
  useMultiStyleConfig,
  Box,
  Center,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  List,
  ListItem,
  Portal,
  Text,
} from "@chakra-ui/core";
import { gql } from "@apollo/client";
import { UserAvatarList_UserFragment } from "@parallel/graphql/__types";
import { ExtendChakra } from "@parallel/chakra/utils";

export function UserAvatarList({
  users,
  size = "xs",
}: ExtendChakra<{
  users: UserAvatarList_UserFragment[];
  size?: string;
}>) {
  const styles = useMultiStyleConfig("Avatar", { size });
  const max = 3;
  const slice = users.length > max ? users.slice(0, max) : [...users];
  slice.reverse();
  const excess = users.length > max ? users.length - max : null;

  return (
    <Flex
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
}

UserAvatarList.fragments = {
  User: gql`
    fragment UserAvatarList_User on User {
      id
      fullName
    }
  `,
};
