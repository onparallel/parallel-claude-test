import { useMutation } from "@apollo/react-hooks";
import {
  useCreateContact_createContactMutation,
  useCreateContact_createContactMutationVariables,
} from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useCallback } from "react";
import { useAskContactDetailsDialog } from "../components/common/AskContactDetailsDialog";

export function useCreateContact() {
  const [createContact] = useMutation<
    useCreateContact_createContactMutation,
    useCreateContact_createContactMutationVariables
  >(
    gql`
      mutation useCreateContact_createContact($data: CreateContactInput!) {
        createContact(data: $data) {
          id
          email
          firstName
          lastName
          fullName
        }
      }
    `
  );

  const askContactDetails = useAskContactDetailsDialog();

  return useCallback(async function ({
    defaultEmail,
  }: {
    defaultEmail?: string;
  }) {
    const details = await askContactDetails({ defaultEmail });
    const { data, errors } = await createContact({
      variables: { data: details },
    });
    if (errors) {
      throw errors;
    }
    return data!.createContact;
  },
  []);
}
