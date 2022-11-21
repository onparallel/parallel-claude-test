import { gql, useMutation } from "@apollo/client";
import { Button, Stack, Text } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { useAskContactDetailsDialog } from "@parallel/components/common/dialogs/AskContactDetailsDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useCreateContact_createContactDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { isApolloError } from "../apollo/isApolloError";
import { useGenericErrorToast } from "../useGenericErrorToast";

export function useCreateContact() {
  const [createContact] = useMutation(useCreateContact_createContactDocument);
  const askContactDetails = useAskContactDetailsDialog();
  const showGenericErrorToast = useGenericErrorToast();

  const showForceClientDialog = useDialog(ForceCreateContactDialog);

  return useCallback(async function ({ defaultEmail }: { defaultEmail?: string }) {
    try {
      const details = await askContactDetails({ defaultEmail });
      try {
        const { data } = await createContact({
          variables: { data: details },
        });

        return data!.createContact;
      } catch (error) {
        if (
          isApolloError(error, "ARG_VALIDATION_ERROR") &&
          (error as any).graphQLErrors[0]?.extensions?.extra?.error_code ===
            "INVALID_MX_EMAIL_ERROR"
        ) {
          await showForceClientDialog();

          try {
            const { data } = await createContact({
              variables: { data: details, force: true },
            });

            return data!.createContact;
          } catch (error) {
            showGenericErrorToast(error);
          }
        } else {
          showGenericErrorToast(error);
        }
        return null;
      }
    } catch {}
  }, []);
}

function ForceCreateContactDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <Stack direction={"row"} spacing={2} align="center">
          <AlertCircleIcon role="presentation" />
          <Text>
            <FormattedMessage
              id="component.use-create-contact.force-contact-header"
              defaultMessage="Failed to verify email"
            />
          </Text>
        </Stack>
      }
      body={
        <>
          <Text>
            <FormattedMessage
              id="component.use-create-contact.force-contact-body"
              defaultMessage="We could not verify this email address. You may not be able to send emails to this address."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.use-create-contact.force-contact-question"
              defaultMessage="Do you still want to create the contact?"
            />
          </Text>
        </>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.use-create-contact.create-contact"
            defaultMessage="Create contact"
          />
        </Button>
      }
    />
  );
}

useCreateContact.mutations = [
  gql`
    mutation useCreateContact_createContact($data: CreateContactInput!, $force: Boolean) {
      createContact(data: $data, force: $force) {
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
