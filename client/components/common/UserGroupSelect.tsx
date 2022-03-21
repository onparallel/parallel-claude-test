import { gql, useApolloClient } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/react";
import {
  UserSelect_UserGroupFragment,
  useSearchUserGroups_searchUserGroupsDocument,
} from "@parallel/graphql/__types";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { components } from "react-select";
import { EmptySearchTemplatesIcon } from "../petition-new/icons/EmtpySearchTemplatesIcon";
import { UserSelect, UserSelectComponentProps, UserSelectProps } from "./UserSelect";

interface UserGroupSelectProps<IsMulti extends boolean>
  extends UserSelectProps<IsMulti, true, UserSelect_UserGroupFragment> {}

export function UserGroupSelect<IsMulti extends boolean>({
  includeGroups,
  isMulti,
  ...props
}: UserGroupSelectProps<IsMulti>) {
  const components = useMemo(() => ({ NoOptionsMessage }), []);
  const intl = useIntl();
  return (
    <UserSelect
      isMulti={isMulti}
      includeGroups
      components={components}
      placeholder={intl.formatMessage({
        id: "component.user-group-select.placeholder",
        defaultMessage: "Select teams from your organization",
      })}
      {...props}
    />
  );
}

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
    async (
      search: string,
      options: {
        excludeUserGroups?: string[];
      } = {}
    ) => {
      const { excludeUserGroups } = options;
      const { data } = await client.query({
        query: useSearchUserGroups_searchUserGroupsDocument,
        variables: {
          search,
          excludeUserGroups,
        },
        fetchPolicy: "no-cache",
      });
      return data!.searchUserGroups as UserSelect_UserGroupFragment[];
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
