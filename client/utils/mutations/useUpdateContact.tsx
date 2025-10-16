import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useUpdateContact_updateContactDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useUpdateContact() {
  const [updateContact] = useMutation(useUpdateContact_updateContactDocument);

  return useCallback(async function ({
    id,
    firstName,
    lastName,
  }: {
    id: string;
    firstName?: string;
    lastName?: string;
  }) {
    try {
      const { data } = await updateContact({
        variables: { data: { firstName, lastName }, id },
      });

      return data!.updateContact;
    } catch {}
    return null;
  }, []);
}

useUpdateContact.mutations = [
  gql`
    mutation useUpdateContact_updateContact($id: GID!, $data: UpdateContactInput!) {
      updateContact(id: $id, data: $data) {
        id
        email
        firstName
        lastName
        fullName
        hasBouncedEmail
      }
    }
  `,
];
