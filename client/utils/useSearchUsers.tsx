import { gql, useApolloClient } from "@apollo/client";
import { useSearchUsers_searchUsersDocument } from "@parallel/graphql/__types";
import { UserSelect, UserSelectSelection } from "../components/common/UserSelect";
import { useDebouncedAsync } from "./useDebouncedAsync";

export interface UserSearchUsersOptions<IncludeGroups extends boolean> {
  excludeUsers?: string[];
  excludeUserGroups?: string[];
  includeGroups?: IncludeGroups;
  includeInactive?: boolean;
}

export function useSearchUsers() {
  const client = useApolloClient();
  return useDebouncedAsync(
    async <IncludeGroups extends boolean = false>(
      search: string,
      options: UserSearchUsersOptions<IncludeGroups> = {}
    ): Promise<UserSelectSelection<IncludeGroups>[]> => {
      const { excludeUsers, excludeUserGroups, includeGroups, includeInactive } = options;
      const { data } = await client.query({
        query: useSearchUsers_searchUsersDocument,
        variables: {
          search,
          excludeUsers,
          excludeUserGroups,
          includeGroups,
          includeInactive,
        },
        fetchPolicy: "no-cache",
      });
      return data!.searchUsers as UserSelectSelection<IncludeGroups>[];
    },
    150,
    []
  );
}

const _queries = [
  gql`
    query useSearchUsers_searchUsers(
      $search: String!
      $excludeUsers: [GID!]
      $excludeUserGroups: [GID!]
      $includeGroups: Boolean
      $includeInactive: Boolean
    ) {
      searchUsers(
        search: $search
        excludeUsers: $excludeUsers
        excludeUserGroups: $excludeUserGroups
        includeGroups: $includeGroups
        includeInactive: $includeInactive
      ) {
        ... on User {
          ...UserSelect_User
        }
        ... on UserGroup {
          ...UserSelect_UserGroup
        }
      }
    }
    ${UserSelect.fragments.User}
    ${UserSelect.fragments.UserGroup}
  `,
];
