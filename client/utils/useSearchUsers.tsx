import { gql, useApolloClient } from "@apollo/client";
import {
  useSearchUsers_searchUsersQuery,
  useSearchUsers_searchUsersQueryVariables,
} from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useSearchUsers() {
  const client = useApolloClient();
  return useCallback(
    async (
      search: string,
      options: {
        excludeUsers?: string[];
        excludeUserGroups?: string[];
        includeGroups?: boolean;
        includeInactive?: boolean;
      } = {}
    ) => {
      const {
        excludeUsers,
        excludeUserGroups,
        includeGroups,
        includeInactive,
      } = options;
      const { data } = await client.query<
        useSearchUsers_searchUsersQuery,
        useSearchUsers_searchUsersQueryVariables
      >({
        query: gql`
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
                id
                fullName
                email
              }
              ... on UserGroup {
                id
                name
                members {
                  id
                  fullName
                  email
                }
              }
            }
          }
        `,
        variables: {
          search,
          excludeUsers,
          excludeUserGroups,
          includeGroups,
          includeInactive,
        },
        fetchPolicy: "no-cache",
      });
      return data!.searchUsers;
    },
    []
  );
}
