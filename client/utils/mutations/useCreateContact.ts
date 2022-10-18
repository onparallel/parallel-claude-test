import { gql, useMutation } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import { useAskContactDetailsDialog } from "@parallel/components/common/dialogs/AskContactDetailsDialog";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { useCreateContact_createContactDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { isApolloError } from "../apollo/isApolloError";
import { useGenericErrorToast } from "../useGenericErrorToast";

export function useCreateContact() {
  const [createContact] = useMutation(useCreateContact_createContactDocument);
  const intl = useIntl();
  const askContactDetails = useAskContactDetailsDialog();
  const showGenericErrorToast = useGenericErrorToast();
  const showToast = useToast();

  return useCallback(async function ({ defaultEmail }: { defaultEmail?: string }) {
    try {
      const details = await askContactDetails({ defaultEmail });
      const { data } = await createContact({
        variables: { data: details },
      });
      return data!.createContact;
    } catch (error) {
      if (isDialogError(error)) {
      } else if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
        showToast({
          title: intl.formatMessage({
            id: "contacts.email-error.validation-failed",
            defaultMessage: "The email validation has failed",
          }),
          description: intl.formatMessage({
            id: "contacts.email-error.check-correct-email",
            defaultMessage: "Please make sure that the email is correct.",
          }),
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
        showGenericErrorToast(error);
      }
      return null;
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
