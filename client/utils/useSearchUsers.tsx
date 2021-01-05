import { gql, useApolloClient } from "@apollo/client";
import {
  SearchUsersQuery,
  SearchUsersQueryVariables,
} from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useSearchUsers() {
  const client = useApolloClient();
  return useCallback(async (search: string, exclude: string[]) => {
    const { data } = await client.query<
      SearchUsersQuery,
      SearchUsersQueryVariables
    >({
      query: gql`
        query SearchUsers($search: String!, $exclude: [GID!]!) {
          me {
            organization {
              users(search: $search, limit: 10, exclude: $exclude) {
                items {
                  id
                  fullName
                  email
                }
              }
            }
          }
        }
      `,
      variables: { search, exclude },
      fetchPolicy: "no-cache",
    });
    return data!.me.organization.users.items;
  }, []);
}
