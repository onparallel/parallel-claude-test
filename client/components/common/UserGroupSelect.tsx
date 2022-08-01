import { gql, useApolloClient } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/react";
import {
  UserSelect_UserGroupFragment,
  useSearchUserGroups_searchUserGroupsDocument,
} from "@parallel/graphql/__types";
import { genericRsComponent } from "@parallel/utils/react-select/hooks";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { EmptySearchIcon } from "./icons/EmptySearchIcon";
import { UserSelect, UserSelectProps } from "./UserSelect";

interface UserGroupSelectProps<IsMulti extends boolean>
  extends UserSelectProps<IsMulti, true, false, UserSelect_UserGroupFragment> {}

export function UserGroupSelect<IsMulti extends boolean>({
  includeGroups,
  isMulti,
  ...props
}: UserGroupSelectProps<IsMulti>) {
  const intl = useIntl();
  return (
    <UserSelect
      isMulti={isMulti}
      includeGroups
      components={{ NoOptionsMessage }}
      placeholder={intl.formatMessage({
        id: "component.user-group-select.placeholder",
        defaultMessage: "Select teams from your organization",
      })}
      {...props}
    />
  );
}

const rsComponent = genericRsComponent<UserSelect_UserGroupFragment, any, never>();

const NoOptionsMessage = rsComponent("NoOptionsMessage", function (props) {
  const {
    selectProps: { inputValue: search },
  } = props;
  return (
    <Stack alignItems="center" textAlign="center" padding={4} spacing={4}>
      {search ? (
        <>
          <EmptySearchIcon width="166px" height="77px" />
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
});

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
