import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useSearchContactsByEmail_contactsByEmailDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";

export function useSearchContactsByEmail() {
  const apollo = useApolloClient();
  return useCallback(async function (emails: string[]) {
    const { data } = await apollo.query({
      query: useSearchContactsByEmail_contactsByEmailDocument,
      variables: { emails },
      fetchPolicy: "no-cache",
    });
    assert(
      isNonNullish(data),
      "Result data in useSearchContactsByEmail_contactsByEmailDocument is missing",
    );
    return data.contactsByEmail;
  }, []);
}

useSearchContactsByEmail.queries = {
  contactsByEmail: gql`
    query useSearchContactsByEmail_contactsByEmail($emails: [String!]!) {
      contactsByEmail(emails: $emails) {
        ...ContactSelect_Contact
      }
    }
  `,
};
