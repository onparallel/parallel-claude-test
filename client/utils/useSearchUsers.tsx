import { gql, useApolloClient } from "@apollo/client";
import { UserSelect_UserFragment, useSearchUsers_usersDocument } from "@parallel/graphql/__types";
import { UserSelect, UserSelectSelection } from "../components/common/UserSelect";
import { useDebouncedAsync } from "./useDebouncedAsync";

interface UserSearchUsersOptions {
  excludeIds?: string[];
}

export function useSearchUsers() {
  const client = useApolloClient();
  return useDebouncedAsync(
    async (
      search: string,
      options: UserSearchUsersOptions = {},
    ): Promise<UserSelectSelection[]> => {
      const { excludeIds } = options;
      const { data } = await client.query({
        query: useSearchUsers_usersDocument,
        variables: {
          search,
          exclude: excludeIds,
          filters: { status: ["ACTIVE"] },
          limit: 100,
          offset: 0,
        },
        fetchPolicy: "no-cache",
      });
      return data.me.organization.users.items as UserSelect_UserFragment[];
    },
    150,
    [],
  );
}

const _queries = [
  gql`
    query useSearchUsers_users(
      $limit: Int
      $offset: Int
      $search: String!
      $exclude: [GID!]
      $filters: UserFilter
    ) {
      me {
        id
        organization {
          users(
            limit: $limit
            offset: $offset
            search: $search
            exclude: $exclude
            filters: $filters
          ) {
            items {
              ...UserSelect_User
            }
          }
        }
      }
    }
    ${UserSelect.fragments.User}
  `,
];
