import { gql, useMutation } from "@apollo/client";
import { Alert, AlertIcon, Box, Button, Stack, Text } from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import {
  useConfirmDeleteContactsDialog_ContactFragment,
  useDeleteContacts_ContactFragment,
  useDeleteContacts_deleteContactsDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { isApolloError } from "../apollo/isApolloError";

export function useDeleteContacts() {
  const [deleteContacts] = useMutation(useDeleteContacts_deleteContactsDocument);

  const showConfirmDeleteContacts = useConfirmDeleteContactsDialog();

  return async function (contacts: useDeleteContacts_ContactFragment[]) {
    try {
      await deleteContacts({ variables: { ids: contacts.map((c) => c.id) } });
    } catch (e) {
      if (isApolloError(e, "CONTACT_HAS_ACTIVE_ACCESSES_ERROR")) {
        await showConfirmDeleteContacts({
          contacts,
          extra: e.graphQLErrors[0].extensions as any,
        });
        await deleteContacts({ variables: { ids: contacts.map((c) => c.id), force: true } });
      }
    }
  };
}

useDeleteContacts.mutations = [
  gql`
    mutation useDeleteContacts_deleteContacts($ids: [GID!]!, $force: Boolean) {
      deleteContacts(ids: $ids, force: $force)
    }
  `,
];

useDeleteContacts.fragments = {
  Contact: gql`
    fragment useDeleteContacts_Contact on Contact {
      id
      fullName
      email
    }
  `,
};

function useConfirmDeleteContactsDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(
    async ({
      contacts,
      extra,
    }: {
      contacts: useConfirmDeleteContactsDialog_ContactFragment[];
      extra: { PENDING: number; COMPLETED: number; CLOSED: number };
    }) => {
      return await showDialog({
        size: "lg",
        header: (
          <FormattedMessage
            id="component.use-delete-contact.confirm-delete-header"
            defaultMessage="Delete {count, plural, =1{{email}} other {# contacts}}"
            values={{ email: contacts[0].email, count: contacts.length }}
          />
        ),
        description: (
          <Stack>
            <Alert status="warning" borderRadius="md">
              <AlertIcon color="yellow.500" />
              {contacts.length === 1 ? (
                <Box>
                  <FormattedMessage
                    id="component.use-delete-contact.confirm-delete-alert-single-text"
                    defaultMessage="This contact has access to:"
                  />
                  <Stack as="ul" paddingLeft={8} spacing={0}>
                    {extra.PENDING > 0 ? (
                      <Text as="li">
                        <FormattedMessage
                          id="component.use-delete-contact.confirm-delete-alert.pending-parallels"
                          defaultMessage="{count} pending {count, plural, =1{parallel} other{parallels}}"
                          values={{ count: extra.PENDING }}
                        />
                      </Text>
                    ) : null}
                    {extra.COMPLETED > 0 ? (
                      <Text as="li">
                        <FormattedMessage
                          id="component.use-delete-contact.confirm-delete-alert.completed-parallels"
                          defaultMessage="{count} completed {count, plural, =1{parallel} other{parallels}}"
                          values={{ count: extra.COMPLETED }}
                        />
                      </Text>
                    ) : null}
                    {extra.CLOSED > 0 ? (
                      <Text as="li">
                        <FormattedMessage
                          id="component.use-delete-contact.confirm-delete-alert.closed-parallels"
                          defaultMessage="{count} closed {count, plural, =1{parallel} other{parallels}}"
                          values={{ count: extra.CLOSED }}
                        />
                      </Text>
                    ) : null}
                  </Stack>
                </Box>
              ) : (
                <FormattedMessage
                  id="component.use-delete-contact.confirm-delete-alert-multiple-text"
                  defaultMessage="We have found parallels sent to some of these contacts."
                />
              )}
            </Alert>
            <Text>
              <FormattedMessage
                id="component.use-delete-contact.confirm-delete-body.1"
                defaultMessage="If you continue, the {count, plural, =1{contact} other{contacts}} won't be able to access their replies anymore."
                values={{ count: contacts.length }}
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.use-delete-contact.confirm-delete-body.2"
                defaultMessage="Are you sure you want to delete {count, plural, =1{<b>{fullName} <{email}></b>} other{these contacts}}?"
                values={{
                  count: contacts.length,
                  fullName: contacts[0].fullName,
                  email: contacts[0].email,
                }}
              />
            </Text>
          </Stack>
        ),
        confirm: (
          <Button colorScheme="red" type="submit">
            <FormattedMessage
              id="component.use-delete-contact.confirm-delete-button"
              defaultMessage="Yes, delete {count, plural, =1{contact} other {contacts}}"
              values={{ count: contacts.length }}
            />
          </Button>
        ),
      });
    },
    []
  );
}
