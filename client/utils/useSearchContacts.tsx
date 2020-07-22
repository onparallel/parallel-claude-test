import { gql, useApolloClient } from "@apollo/client";
import { RecipientSelect } from "@parallel/components/common/RecipientSelect";
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
            $exclude: [ID!]
          ) {
            contacts(limit: 10, search: $search, exclude: $exclude) {
              items {
                ...RecipientSelect_Contact
              }
            }
          }
          ${RecipientSelect.fragments.Contact}
        `,
        variables: { search, exclude },
      });
      return data!.contacts.items;
    },
    300,
    []
  );
}
