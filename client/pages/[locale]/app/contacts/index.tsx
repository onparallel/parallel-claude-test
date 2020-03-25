import {
  MutationHookOptions,
  useMutation,
  useQuery,
} from "@apollo/react-hooks";
import { Button, Flex, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { Title } from "@parallel/components/common/Title";
import { ContactListHeader } from "@parallel/components/contacts/ContactListHeader";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  ContactsQuery,
  ContactsQueryVariables,
  ContactsUserQuery,
  Contacts_ContactsListFragment,
  Contacts_deleteContactsMutation,
  Contacts_deleteContactsMutationVariables,
} from "@parallel/graphql/__types";
import { clearCache } from "@parallel/utils/apollo";
import {
  integer,
  parseQuery,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { UnwrapArray } from "@parallel/utils/types";
import { useCreateContact } from "@parallel/utils/useCreateContact";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { memo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const PAGE_SIZE = 10;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
};

function Contacts() {
  const intl = useIntl();
  const router = useRouter();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const { me } = useQueryData<ContactsUserQuery>(GET_CONTACTS_USER_DATA);
  const { data, loading, refetch } = useQuery<
    ContactsQuery,
    ContactsQueryVariables
  >(GET_CONTACTS_DATA, {
    variables: {
      offset: PAGE_SIZE * (state.page - 1),
      limit: PAGE_SIZE,
      search: state.search,
    },
  });

  const createContact = useCreateContact();

  const [deleteContact] = useDeleteContact({
    update(cache) {
      clearCache(cache, /\$ROOT_QUERY\.contacts\(/);
      refetch();
    },
  });

  const { contacts } = data!;

  const [selected, setSelected] = useState<string[]>();
  const confirmDelete = useDialog(ConfirmDeleteContacts, [selected, contacts]);

  function handleSearchChange(value: string | null) {
    setQueryState((current) => ({
      ...current,
      search: value,
      page: 1,
    }));
  }

  function handleRowClick(row: ContactSelection) {
    router.push(
      `/[locale]/app/contacts/[contactId]`,
      `/${router.query.locale}/app/contacts/${row.id}`
    );
  }

  function handlePageChange(page: number) {
    setQueryState((current) => ({
      ...current,
      page,
    }));
  }

  async function handleCreateClick() {
    try {
      const id = await createContact();
      refetch();
    } catch {}
  }

  async function handleDeleteClick() {
    try {
      await confirmDelete({
        selected: contacts.items.filter((p) => selected!.includes(p.id)),
      });
      await deleteContact({
        variables: { ids: selected! },
      });
    } catch {}
  }

  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "contacts.title",
          defaultMessage: "Contacts",
        })}
      </Title>
      <AppLayout user={me}>
        <TablePage
          columns={COLUMNS}
          rows={contacts.items}
          rowKeyProp={"id"}
          selectable
          highlightable
          loading={loading}
          onRowClick={handleRowClick}
          header={
            <ContactListHeader
              search={state.search}
              showActions={Boolean(selected?.length)}
              onSearchChange={handleSearchChange}
              onCreateClick={handleCreateClick}
              onDeleteClick={handleDeleteClick}
            />
          }
          body={
            contacts.totalCount === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="contacts.no-results"
                      defaultMessage="There's no contacts matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
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
          page={state.page}
          pageSize={PAGE_SIZE}
          totalCount={contacts.totalCount}
          onSelectionChange={setSelected}
          onPageChange={handlePageChange}
          margin={4}
        ></TablePage>
      </AppLayout>
    </>
  );
}

type ContactSelection = UnwrapArray<Contacts_ContactsListFragment["items"]>;

const COLUMNS: TableColumn<ContactSelection>[] = [
  {
    key: "firstName",
    Header: memo(() => (
      <FormattedMessage
        id="contacts.header.first-name"
        defaultMessage="First name"
      />
    )),
    Cell: memo(({ row }) => <>{row.firstName}</>),
  },
  {
    key: "lastName",
    Header: memo(() => (
      <FormattedMessage
        id="contacts.header.last-name"
        defaultMessage="Last name"
      />
    )),
    Cell: memo(({ row }) => <>{row.lastName}</>),
  },
  {
    key: "email",
    Header: memo(() => (
      <FormattedMessage id="contacts.header.email" defaultMessage="Email" />
    )),
    Cell: memo(({ row }) => <>{row.email}</>),
  },
];

function useDeleteContact(
  options?: MutationHookOptions<
    Contacts_deleteContactsMutation,
    Contacts_deleteContactsMutationVariables
  >
) {
  return useMutation<
    Contacts_deleteContactsMutation,
    Contacts_deleteContactsMutationVariables
  >(
    gql`
      mutation Contacts_deleteContacts($ids: [ID!]!) {
        deleteContacts(ids: $ids)
      }
    `,
    options
  );
}

function ConfirmDeleteContacts({
  selected,
  ...props
}: {
  selected: ContactSelection[];
} & DialogCallbacks<void>) {
  const count = selected.length;
  const email = selected.length && selected[0].email;
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="contacts.confirm-delete.header"
          defaultMessage="Delete contacts"
        />
      }
      body={
        <FormattedMessage
          id="contacts.confirm-delete.body"
          defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{email}</b>} other {the <b>#</b> selected contacts}}?"
          values={{
            count,
            email,
            b: (...chunks: any[]) => <b>{chunks}</b>,
          }}
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="generic.confirm-delete-button"
            defaultMessage="Yes, delete"
          />
        </Button>
      }
      {...props}
    />
  );
}

Contacts.fragments = {
  contacts: gql`
    fragment Contacts_ContactsList on ContactPagination {
      items {
        id
        fullName
        firstName
        lastName
        email
      }
      totalCount
    }
  `,
  user: gql`
    fragment Contacts_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.user}
  `,
};

const GET_CONTACTS_DATA = gql`
  query Contacts($offset: Int!, $limit: Int!, $search: String) {
    contacts(offset: $offset, limit: $limit, search: $search) {
      ...Contacts_ContactsList
    }
  }
  ${Contacts.fragments.contacts}
`;

const GET_CONTACTS_USER_DATA = gql`
  query ContactsUser {
    me {
      ...Contacts_User
    }
  }
  ${Contacts.fragments.user}
`;

Contacts.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  const { page, search } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    apollo.query<ContactsQuery, ContactsQueryVariables>({
      query: GET_CONTACTS_DATA,
      variables: {
        offset: PAGE_SIZE * (page - 1),
        limit: PAGE_SIZE,
        search,
      },
    }),
    apollo.query<ContactsUserQuery>({ query: GET_CONTACTS_USER_DATA }),
  ]);
};

export default withData(Contacts);
