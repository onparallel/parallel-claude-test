import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  ListItem,
  Stack,
  UnorderedList,
} from "@chakra-ui/react";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { Button, Text } from "@parallel/components/ui";
import {
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
          extra: e.errors[0].extensions as any,
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

const _fragments = {
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
      contacts: useDeleteContacts_ContactFragment[];
      extra: { PENDING: number; COMPLETED: number; CLOSED: number };
    }) => {
      return await showDialog({
        size: "lg",
        header: (
          <FormattedMessage
            id="util.use-delete-contact.confirm-delete-header"
            defaultMessage="Delete {count, plural, =1{{email}} other {# contacts}}"
            values={{ email: contacts[0].email, count: contacts.length }}
          />
        ),

        description: (
          <Stack>
            <Alert status="warning" rounded="md">
              <AlertIcon />
              <AlertDescription>
                {contacts.length === 1 ? (
                  <>
                    <Text>
                      <FormattedMessage
                        id="util.use-delete-contact.confirm-delete-alert-single-text"
                        defaultMessage="This contact has access to:"
                      />
                    </Text>
                    <UnorderedList paddingStart={4}>
                      {extra.PENDING > 0 ? (
                        <ListItem>
                          <FormattedMessage
                            id="util.use-delete-contact.confirm-delete-pending-parallels"
                            defaultMessage="{count} pending {count, plural, =1{parallel} other{parallels}}"
                            values={{ count: extra.PENDING }}
                          />
                        </ListItem>
                      ) : null}
                      {extra.COMPLETED > 0 ? (
                        <ListItem>
                          <FormattedMessage
                            id="util.use-delete-contact.confirm-delete-completed-parallels"
                            defaultMessage="{count} completed {count, plural, =1{parallel} other{parallels}}"
                            values={{ count: extra.COMPLETED }}
                          />
                        </ListItem>
                      ) : null}
                      {extra.CLOSED > 0 ? (
                        <ListItem>
                          <FormattedMessage
                            id="util.use-delete-contact.confirm-delete-closed-parallels"
                            defaultMessage="{count} closed {count, plural, =1{parallel} other{parallels}}"
                            values={{ count: extra.CLOSED }}
                          />
                        </ListItem>
                      ) : null}
                    </UnorderedList>
                  </>
                ) : (
                  <FormattedMessage
                    id="util.use-delete-contact.confirm-delete-alert-multiple-text"
                    defaultMessage="We have found parallels sent to some of these contacts."
                  />
                )}
              </AlertDescription>
            </Alert>
            <Text>
              <FormattedMessage
                id="util.use-delete-contact.confirm-delete-body.1"
                defaultMessage="If you continue, the {count, plural, =1{contact} other{contacts}} won't be able to access their replies anymore."
                values={{ count: contacts.length }}
              />
            </Text>
            <Text>
              <FormattedMessage
                id="util.use-delete-contact.confirm-delete-body.2"
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
          <Button colorPalette="red" type="submit">
            <FormattedMessage
              id="util.use-delete-contact.confirm-delete-button"
              defaultMessage="Yes, delete {count, plural, =1{contact} other {contacts}}"
              values={{ count: contacts.length }}
            />
          </Button>
        ),
      });
    },
    [],
  );
}
