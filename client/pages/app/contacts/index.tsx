import { gql } from "@apollo/client";
import { Flex, Text, useToast } from "@chakra-ui/react";
import { DateTime } from "@parallel/components/common/DateTime";
import { useDialog, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { ContactListHeader } from "@parallel/components/contact-list/ContactListHeader";
import { ImportContactsDialog } from "@parallel/components/contact-list/dialogs/ImportContactsDialog";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  Contacts_contactsDocument,
  Contacts_ContactsListFragment,
  Contacts_userDocument,
  QueryContacts_OrderBy,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useGoToContact } from "@parallel/utils/goToContact";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { useDeleteContacts } from "@parallel/utils/mutations/useDeleteContacts";
import { withError } from "@parallel/utils/promises/withError";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { UnwrapArray } from "@parallel/utils/types";
import { useExistingContactToast } from "@parallel/utils/useExistingContactToast";
import { MouseEvent, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const SORTING = ["firstName", "lastName", "fullName", "email", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "firstName",
    direction: "ASC",
  }),
};

function Contacts() {
  const intl = useIntl();
  const showToast = useToast();
  const errorToast = useExistingContactToast();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me },
  } = useAssertQuery(Contacts_userDocument);
  const {
    data: { contacts },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(Contacts_contactsDocument, {
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
      search: state.search,
      sortBy: [`${state.sort.field}_${state.sort.direction}` as QueryContacts_OrderBy],
    },
  });
  const createContact = useCreateContact();

  const [selected, setSelected] = useState<string[]>([]);

  function handleSearchChange(value: string | null) {
    setQueryState((current) => ({
      ...current,
      search: value,
      page: 1,
    }));
  }

  const goToContact = useGoToContact();
  function handleRowClick(row: ContactSelection, event: MouseEvent) {
    goToContact(row.id, event);
  }

  async function handleCreateClick() {
    try {
      await createContact({});
      refetch();
    } catch (error) {
      if (isApolloError(error, "EXISTING_CONTACT")) {
        errorToast();
      }
      if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
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
      }
    }
  }
  const deleteContacts = useDeleteContacts();
  async function handleDeleteClick() {
    try {
      await deleteContacts(contacts.items.filter((c) => selected.includes(c.id)));
      await refetch();
    } catch {}
  }

  const showImportContactsDialog = useDialog(ImportContactsDialog);

  async function handleImportClick() {
    const [error, data] = await withError(showImportContactsDialog({}));
    if (!error) {
      await refetch();
      showToast({
        title: intl.formatMessage(
          {
            id: "contacts.successful-import-toast.title",
            defaultMessage:
              "{count, plural, =1{# contact} other{# contacts}} imported successfully!",
          },
          { count: data!.count }
        ),
        status: "success",
      });
    }
  }

  const columns = useContactsColumns();

  return (
    <AppLayout
      title={intl.formatMessage({
        id: "contacts.title",
        defaultMessage: "Contacts",
      })}
      user={me}
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          columns={columns}
          rows={contacts.items}
          rowKeyProp={"id"}
          isSelectable
          isHighlightable
          loading={loading}
          onRowClick={handleRowClick}
          page={state.page}
          pageSize={state.items}
          totalCount={contacts.totalCount}
          sort={state.sort}
          onSelectionChange={setSelected}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <ContactListHeader
              search={state.search}
              selectionCount={selected.length}
              onSearchChange={handleSearchChange}
              onReload={() => refetch()}
              onCreateClick={handleCreateClick}
              onDeleteClick={handleDeleteClick}
              onImportClick={handleImportClick}
            />
          }
          body={
            contacts.totalCount === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center" height="300px">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="contacts.no-results"
                      defaultMessage="There's no contacts matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center" height="300px">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="contacts.no-contacts"
                      defaultMessage="You have no contacts yet. Start by creating one now!"
                    />
                  </Text>
                </Flex>
              )
            ) : null
          }
        />
      </Flex>
    </AppLayout>
  );
}

type ContactSelection = UnwrapArray<Contacts_ContactsListFragment["items"]>;

function useContactsColumns(): TableColumn<ContactSelection>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "firstName",
        isSortable: true,
        header: intl.formatMessage({
          id: "contacts.header.first-name",
          defaultMessage: "First name",
        }),
        CellContent: ({ row }) => (
          <>
            {row.firstName || (
              <Text as="span" textStyle="hint">
                <FormattedMessage id="generic.not-specified" defaultMessage="Not specified" />
              </Text>
            )}
          </>
        ),
      },
      {
        key: "lastName",
        isSortable: true,
        header: intl.formatMessage({
          id: "contacts.header.last-name",
          defaultMessage: "Last name",
        }),
        CellContent: ({ row }) => (
          <>
            {row.lastName || (
              <Text as="span" textStyle="hint">
                <FormattedMessage id="generic.not-specified" defaultMessage="Not specified" />
              </Text>
            )}
          </>
        ),
      },
      {
        key: "email",
        isSortable: true,
        header: intl.formatMessage({
          id: "contacts.header.email",
          defaultMessage: "Email",
        }),
        CellContent: ({ row }) => <>{row.email}</>,
      },
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime whiteSpace="nowrap" />
        ),
      },
    ],
    [intl.locale]
  );
}

Contacts.fragments = {
  Contacts: gql`
    fragment Contacts_ContactsList on ContactPagination {
      items {
        id
        fullName
        firstName
        lastName
        email
        createdAt
        ...useDeleteContacts_Contact
      }
      totalCount
    }
    ${useDeleteContacts.fragments.Contact}
  `,
  User: gql`
    fragment Contacts_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};

Contacts.queries = [
  gql`
    query Contacts_contacts(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [QueryContacts_OrderBy!]
    ) {
      contacts(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
        ...Contacts_ContactsList
      }
    }
    ${Contacts.fragments.Contacts}
  `,
  gql`
    query Contacts_user {
      me {
        ...Contacts_User
      }
    }
    ${Contacts.fragments.User}
  `,
];

Contacts.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const { page, items, search, sort } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    fetchQuery(Contacts_contactsDocument, {
      variables: {
        offset: items * (page - 1),
        limit: items,
        search,
        sortBy: [`${sort.field}_${sort.direction}` as QueryContacts_OrderBy],
      },
    }),
    fetchQuery(Contacts_userDocument),
  ]);
};

export default compose(withDialogs, withApolloData)(Contacts);
