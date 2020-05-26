import { Box, Button, Flex, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DateTime } from "@parallel/components/common/DateTime";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { Title } from "@parallel/components/common/Title";
import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import { ContactListHeader } from "@parallel/components/contact-list/ContactListHeader";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  ContactsQuery,
  ContactsQueryVariables,
  ContactsUserQuery,
  Contacts_ContactsListFragment,
  QueryContacts_OrderBy,
  useContactsQuery,
  useContactsUserQuery,
  useContacts_deleteContactsMutation,
} from "@parallel/graphql/__types";
import { assertQuery, clearCache } from "@parallel/utils/apollo";
import { FORMATS } from "@parallel/utils/dates";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { UnwrapArray } from "@parallel/utils/types";
import { useCreateContact } from "@parallel/utils/useCreateContact";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const PAGE_SIZE = 10;

const SORTING = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "createdAt",
] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "firstName",
    direction: "ASC",
  }),
};

function Contacts() {
  const intl = useIntl();
  const router = useRouter();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me },
  } = assertQuery(useContactsUserQuery());
  const { data, loading, refetch } = useContactsQuery({
    variables: {
      offset: PAGE_SIZE * (state.page - 1),
      limit: PAGE_SIZE,
      search: state.search,
      sortBy: [
        `${state.sort.field}_${state.sort.direction}` as QueryContacts_OrderBy,
      ],
    },
  });

  const createContact = useCreateContact();

  const [deleteContact] = useContacts_deleteContactsMutation({
    update(cache) {
      clearCache(cache, /\$ROOT_QUERY\.contacts\(/);
      refetch();
    },
  });

  const { contacts } = data!;

  const [selected, setSelected] = useState<string[]>();
  const confirmDelete = useDialog(ConfirmDeleteContacts);

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

  async function handleCreateClick() {
    try {
      await createContact({});
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

  const columns = useContactsColumns();

  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "contacts.title",
          defaultMessage: "Contacts",
        })}
      </Title>
      <AppLayout user={me}>
        <Box padding={4} paddingBottom={24}>
          <TablePage
            columns={columns}
            rows={contacts.items}
            rowKeyProp={"id"}
            isSelectable
            isHighlightable
            loading={loading}
            onRowClick={handleRowClick}
            page={state.page}
            pageSize={PAGE_SIZE}
            totalCount={contacts.totalCount}
            sort={state.sort}
            onSelectionChange={setSelected}
            onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
            onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
            header={
              <ContactListHeader
                search={state.search}
                showActions={Boolean(selected?.length)}
                onSearchChange={handleSearchChange}
                onReload={() => refetch()}
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
          ></TablePage>
        </Box>
      </AppLayout>
    </>
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
              <Text as="span" color="gray.400" fontStyle="italic">
                <FormattedMessage
                  id="generic.not-specified"
                  defaultMessage="Not specified"
                />
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
              <Text as="span" color="gray.400" fontStyle="italic">
                <FormattedMessage
                  id="generic.not-specified"
                  defaultMessage="Not specified"
                />
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
          id: "contacts.header.created-at",
          defaultMessage: "Created at",
        }),
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime />
        ),
      },
    ],
    []
  );
}

function ConfirmDeleteContacts({
  selected,
  ...props
}: {
  selected: ContactSelection[];
} & DialogProps<void>) {
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
  Contacts: gql`
    fragment Contacts_ContactsList on ContactPagination {
      items {
        id
        fullName
        firstName
        lastName
        email
        createdAt
      }
      totalCount
    }
  `,
  User: gql`
    fragment Contacts_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};

Contacts.mutations = [
  gql`
    mutation Contacts_deleteContacts($ids: [ID!]!) {
      deleteContacts(ids: $ids)
    }
  `,
];

Contacts.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  const { page, search, sort } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    apollo.query<ContactsQuery, ContactsQueryVariables>({
      query: gql`
        query Contacts(
          $offset: Int!
          $limit: Int!
          $search: String
          $sortBy: [QueryContacts_OrderBy!]
        ) {
          contacts(
            offset: $offset
            limit: $limit
            search: $search
            sortBy: $sortBy
          ) {
            ...Contacts_ContactsList
          }
        }
        ${Contacts.fragments.Contacts}
      `,
      variables: {
        offset: PAGE_SIZE * (page - 1),
        limit: PAGE_SIZE,
        search,
        sortBy: [`${sort.field}_${sort.direction}` as QueryContacts_OrderBy],
      },
    }),
    apollo.query<ContactsUserQuery>({
      query: gql`
        query ContactsUser {
          me {
            ...Contacts_User
          }
        }
        ${Contacts.fragments.User}
      `,
    }),
  ]);
};

export default withData(Contacts);
