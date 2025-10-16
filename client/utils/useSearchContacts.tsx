import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { ContactSelect } from "@parallel/components/common/ContactSelect";
import { useSearchContacts_contactsDocument } from "@parallel/graphql/__types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";

export function useSearchContacts() {
  const apollo = useApolloClient();
  return useDebouncedAsync(
    async (search: string, exclude: string[]) => {
      const { data } = await apollo.query({
        query: useSearchContacts_contactsDocument,
        variables: { search, exclude },
        fetchPolicy: "no-cache",
      });

      assert(isNonNullish(data), "Result data in useSearchContacts_contactsDocument is missing");

      return data.contacts.items;
    },
    300,
    [],
  );
}

useSearchContacts.queries = [
  gql`
    query useSearchContacts_contacts($search: String, $exclude: [GID!]) {
      contacts(limit: 10, search: $search, exclude: $exclude) {
        items {
          ...ContactSelect_Contact
        }
      }
    }
    ${ContactSelect.fragments.Contact}
  `,
];
