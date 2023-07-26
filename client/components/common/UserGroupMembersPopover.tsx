import { gql, useLazyQuery } from "@apollo/client";
import {
  Center,
  Flex,
  List,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  UserGroupMembersPopover_UserGroupFragment,
  UserGroupMembersPopover_getMembersDocument,
} from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { UserGroupReference } from "../petition-activity/UserGroupReference";
import { UserAvatar } from "./UserAvatar";

export interface UserGroupMembersPopoverProps {
  userGroupId: string;
  children: ReactNode;
  userDetails?: (userId: string) => ReactNode;
}

export function UserGroupMembersPopover({
  userGroupId,
  children,
  userDetails,
}: UserGroupMembersPopoverProps) {
  const [getMembers, { data }] = useLazyQuery(UserGroupMembersPopover_getMembersDocument, {
    variables: { userGroupId },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  const group = isDefined(data)
    ? (data.getUsersOrGroups[0] as UserGroupMembersPopover_UserGroupFragment)
    : null;
  return (
    <Popover trigger="hover" onOpen={() => getMembers()}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <Portal>
        <PopoverContent width="fit-content" maxWidth="320px">
          <PopoverArrow />
          {isDefined(group) ? (
            <PopoverHeader borderBottom="none" fontWeight="normal" paddingBottom={0} fontSize="sm">
              <FormattedMessage
                id="component.user-group-members-popover.members-of"
                defaultMessage="Members of {name}:"
                values={{
                  name: <UserGroupReference userGroup={group} />,
                }}
              />
            </PopoverHeader>
          ) : null}
          <PopoverBody paddingX={0} paddingY={2} overflow="auto" maxHeight="300px" minWidth="200px">
            {isDefined(group) ? (
              group.members.length > 0 ? (
                <Stack as={List}>
                  {group.members.map(({ user }) => (
                    <Flex key={user.id} as={ListItem} alignItems="center" paddingX={3}>
                      <UserAvatar size="xs" user={user} />
                      <Flex direction="row" alignItems="center" gap={1}>
                        <Text marginLeft={2} noOfLines={1} wordBreak="break-all">
                          {user.fullName}
                        </Text>
                        {userDetails?.(user.id) ?? null}
                      </Flex>
                    </Flex>
                  ))}
                </Stack>
              ) : (
                <Center height="60px" paddingX={3}>
                  <Text textStyle="hint" fontSize="sm">
                    <FormattedMessage
                      id="component.user-group-members-popover.no-members"
                      defaultMessage="This team has no members yet"
                    />
                  </Text>
                </Center>
              )
            ) : (
              <Center height="100px">
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="primary.500"
                  size="xl"
                />
              </Center>
            )}
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}

const _fragments = {
  UserGroup: gql`
    fragment UserGroupMembersPopover_UserGroup on UserGroup {
      id
      name
      members {
        user {
          id
          fullName
          ...UserAvatar_User
        }
      }
      ...UserGroupReference_UserGroup
    }
    ${UserAvatar.fragments.User}
    ${UserGroupReference.fragments.UserGroup}
  `,
};

const _queries = [
  gql`
    query UserGroupMembersPopover_getMembers($userGroupId: ID!) {
      getUsersOrGroups(ids: [$userGroupId]) {
        ... on UserGroup {
          ...UserGroupMembersPopover_UserGroup
        }
      }
    }
    ${_fragments.UserGroup}
  `,
];
