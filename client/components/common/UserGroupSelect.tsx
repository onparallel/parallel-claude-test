import { gql, useApolloClient } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/react";
import { useSearchUserGroups_searchUserGroupsDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { components } from "react-select";
import { EmptySearchTemplatesIcon } from "../petition-new/icons/EmtpySearchTemplatesIcon";
import {
  UserSelect,
  UserSelectComponentProps,
  UserSelectProps,
  UserSelectSelection,
} from "./UserSelect";

interface UserGroupSelectProps extends Omit<UserSelectProps, "includeGroups"> {}

export function UserGroupSelect(props: UserGroupSelectProps) {
  return <UserSelect components={{ NoOptionsMessage }} {...props} />;
}

UserGroupSelect.fragments = {
  get User() {
    return gql`
      fragment UserSelect_User on User {
        id
        fullName
        email
      }
    `;
  },
  get UserGroup() {
    return gql`
      fragment UserSelect_UserGroup on UserGroup {
        id
        name
        members {
          user {
            ...UserSelect_User
          }
        }
      }
      ${this.User}
    `;
  },
};

const NoOptionsMessage: typeof components.NoOptionsMessage = function NoOptionsMessage(props) {
  const {
    selectProps: { inputValue: search },
  } = props as unknown as UserSelectComponentProps;
  return (
    <Stack alignItems="center" textAlign="center" padding={4} spacing={4}>
      {search ? (
        <>
          <EmptySearchTemplatesIcon width="166px" height="77px" />
          <Text as="strong">
            <FormattedMessage
              id="component.user-group-select.no-options"
              defaultMessage="No teams have been found"
            />
          </Text>
        </>
      ) : (
        <Text as="div" color="gray.400">
          <FormattedMessage
            id="component.user-group-select.search-hint-teams"
            defaultMessage="Search for existing teams"
          />
        </Text>
      )}
    </Stack>
  );
};

export function useSearchUserGroups() {
  const client = useApolloClient();
  return useCallback(
    async <IncludeGroups extends boolean = false>(
      search: string,
      options: {
        excludeUserGroups?: string[];
      } = {}
    ): Promise<UserSelectSelection<IncludeGroups>[]> => {
      const { excludeUserGroups } = options;
      const { data } = await client.query({
        query: useSearchUserGroups_searchUserGroupsDocument,
        variables: {
          search,
          excludeUserGroups,
        },
        fetchPolicy: "no-cache",
      });
      return data!.searchUserGroups as UserSelectSelection<IncludeGroups>[];
    },
    []
  );
}

useSearchUserGroups.queries = [
  gql`
    query useSearchUserGroups_searchUserGroups($search: String!, $excludeUserGroups: [GID!]) {
      searchUserGroups(search: $search, excludeUserGroups: $excludeUserGroups) {
        ...UserSelect_UserGroup
      }
    }
    ${UserSelect.fragments.UserGroup}
  `,
];
