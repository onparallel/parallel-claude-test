import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import {
  UserGroupType,
  UserSelect_UserGroupFragment,
  useSearchUserGroups_userGroupsDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useSearchUserGroups() {
  const client = useApolloClient();
  return useCallback(
    async (
      search: string,
      options: {
        excludeIds?: string[];
        type?: UserGroupType[];
      } = {},
    ) => {
      const { data } = await client.query({
        query: useSearchUserGroups_userGroupsDocument,
        variables: {
          search,
          excludeIds: options.excludeIds,
          type: options.type,
          limit: 100,
          offset: 0,
        },
        fetchPolicy: "no-cache",
      });
      return data?.userGroups.items ?? ([] as UserSelect_UserGroupFragment[]);
    },
    [],
  );
}

const _queries = [
  gql`
    query useSearchUserGroups_userGroups(
      $search: String!
      $excludeIds: [GID!]
      $type: [UserGroupType!]
      $limit: Int
      $offset: Int
    ) {
      userGroups(
        search: $search
        excludeIds: $excludeIds
        type: $type
        limit: $limit
        offset: $offset
      ) {
        items {
          ...UserSelect_UserGroup
        }
      }
    }
  `,
];
