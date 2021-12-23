import { gql, useApolloClient } from "@apollo/client";
import { ContactSelect } from "@parallel/components/common/ContactSelect";
import { useSearchContactsByEmail_contactsByEmailDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useSearchContactsByEmail() {
  const apollo = useApolloClient();
  return useCallback(async function (emails: string[]) {
    const result = await apollo.query({
      query: useSearchContactsByEmail_contactsByEmailDocument,
      variables: { emails },
      fetchPolicy: "no-cache",
    });
    return result.data.contactsByEmail;
  }, []);
}

useSearchContactsByEmail.queries = {
  contactsByEmail: gql`
    query useSearchContactsByEmail_contactsByEmail($emails: [String!]!) {
      contactsByEmail(emails: $emails) {
        ...ContactSelect_Contact
      }
    }
    ${ContactSelect.fragments.Contact}
  `,
};
