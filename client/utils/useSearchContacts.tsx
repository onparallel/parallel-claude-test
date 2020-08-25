import { gql, useApolloClient } from "@apollo/client";
import { ContactSelect } from "@parallel/components/common/ContactSelect";
import {
  PetitionComposeSearchContactsQuery,
  PetitionComposeSearchContactsQueryVariables,
} from "@parallel/graphql/__types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";

export function useSearchContacts() {
  const apollo = useApolloClient();
  return useDebouncedAsync(
    async (search: string, exclude: string[]) => {
      const { data } = await apollo.query<
        PetitionComposeSearchContactsQuery,
        PetitionComposeSearchContactsQueryVariables
      >({
        query: gql`
          query PetitionComposeSearchContacts(
            $search: String
            $exclude: [GID!]
          ) {
            contacts(limit: 10, search: $search, exclude: $exclude) {
              items {
                ...ContactSelect_Contact
              }
            }
          }
          ${ContactSelect.fragments.Contact}
        `,
        variables: { search, exclude },
        fetchPolicy: "no-cache",
      });
      return data!.contacts.items;
    },
    300,
    []
  );
}
