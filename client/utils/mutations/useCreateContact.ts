import { gql, useMutation } from "@apollo/client";
import { useAskContactDetailsDialog } from "@parallel/components/common/dialogs/AskContactDetailsDialog";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { useCreateContact_createContactDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useGenericErrorToast } from "../useGenericErrorToast";

export function useCreateContact() {
  const [createContact] = useMutation(useCreateContact_createContactDocument);

  const askContactDetails = useAskContactDetailsDialog();
  const showGenericErrorToast = useGenericErrorToast();

  return useCallback(async function ({ defaultEmail }: { defaultEmail?: string }) {
    try {
      const details = await askContactDetails({ defaultEmail });
      const { data } = await createContact({
        variables: { data: details },
      });
      return data!.createContact;
    } catch (error) {
      if (isDialogError(error)) {
        return;
      } else {
        showGenericErrorToast(error);
      }
    }
  }, []);
}

useCreateContact.mutations = [
  gql`
    mutation useCreateContact_createContact($data: CreateContactInput!) {
      createContact(data: $data) {
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
