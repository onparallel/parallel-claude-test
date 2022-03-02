import { gql, useMutation } from "@apollo/client";
import { useConfirmDeleteContactsDialog } from "@parallel/components/contact-list/dialogs/ConfirmDeleteContactsDialog";
import {
  useDeleteContacts_ContactFragment,
  useDeleteContacts_deleteContactsDocument,
} from "@parallel/graphql/__types";
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
      ...useConfirmDeleteContactsDialog_Contact
    }
    ${useConfirmDeleteContactsDialog.fragments.Contact}
  `,
};
