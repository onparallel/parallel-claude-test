import { Box, Button, Flex, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { Link } from "@parallel/components/common/Link";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { PetitionProgressBar } from "@parallel/components/common/PetitionProgressBar";
import { PetitionStatusText } from "@parallel/components/common/PetitionStatusText";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { Title } from "@parallel/components/common/Title";
import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useAskPetitionNameDialog } from "@parallel/components/petition-list/AskPetitionNameDialog";
import { PetitionListHeader } from "@parallel/components/petition-list/PetitionListHeader";
import {
  PetitionsQuery,
  PetitionsQueryVariables,
  PetitionStatus,
  PetitionsUserQuery,
  Petitions_PetitionsListFragment,
  QueryPetitions_OrderBy,
  usePetitionsQuery,
  usePetitionsUserQuery,
  usePetitions_clonePetitionMutation,
  usePetitions_deletePetitionsMutation,
} from "@parallel/graphql/__types";
import { assertQuery, clearCache } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import {
  enums,
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { UnwrapArray } from "@parallel/utils/types";
import { useCreatePetition } from "@parallel/utils/useCreatePetition";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const PAGE_SIZE = 10;

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  status: enums<PetitionStatus>(["DRAFT", "PENDING", "COMPLETED"]),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "DESC",
  }),
};

function Petitions() {
  const intl = useIntl();
  const router = useRouter();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me },
  } = assertQuery(usePetitionsUserQuery());
  const {
    data: { petitions },
    loading,
    refetch,
  } = assertQuery(
    usePetitionsQuery({
      variables: {
        offset: PAGE_SIZE * (state.page - 1),
        limit: PAGE_SIZE,
        search: state.search,
        status: state.status,
        sortBy: [
          `${state.sort.field}_${state.sort.direction}` as QueryPetitions_OrderBy,
        ],
      },
    })
  );

  const createPetition = useCreatePetition();

  const [deletePetition] = usePetitions_deletePetitionsMutation({
    update(cache) {
      clearCache(cache, /\$ROOT_QUERY\.petitions\(/);
      refetch();
    },
  });

  const askPetitionName = useAskPetitionNameDialog();
  const [clonePetition] = usePetitions_clonePetitionMutation({
    update(cache) {
      // clear caches where new item would appear
      clearCache(
        cache,
        /\$ROOT_QUERY\.petitions\(.*"status":(null|"DRAFT")[,}]/
      );
      refetch();
    },
  });

  const [selected, setSelected] = useState<string[]>([]);
  const confirmDelete = useDialog(ConfirmDeletePetitionsDialog);

  function handleSearchChange(value: string | null) {
    setQueryState((current) => ({
      ...current,
      search: value,
      page: 1,
    }));
  }

  function handleStatusChange(value: any) {
    setQueryState((current) => ({
      ...current,
      status: value === "ALL" ? null : value,
      page: 1,
    }));
  }

  const handleDeleteClick = useCallback(
    async function () {
      try {
        await confirmDelete({
          selected: petitions.items.filter((p) => selected!.includes(p.id)),
        });
        await deletePetition({
          variables: { ids: selected! },
        });
      } catch {}
    },
    [petitions, selected]
  );

  const handleCloneClick = useCallback(
    async function () {
      try {
        const petition = petitions.items.find((p) => selected[0] === p.id);
        const name = await askPetitionName({
          defaultName: petition?.name ?? undefined,
        });
        const { data } = await clonePetition({
          variables: { petitionId: selected![0], name },
        });
        router.push(
          `/[locale]/app/petitions/[petitionId]/compose`,
          `/${router.query.locale}/app/petitions/${
            data!.clonePetition.id
          }/compose`
        );
      } catch {}
    },
    [petitions, selected]
  );

  const handleCreateClick = useCallback(async function () {
    try {
      const id = await createPetition();
      goToPetition(id, "compose");
    } catch {}
  }, []);

  const handleRowClick = useCallback(function (row: PetitionSelection) {
    goToPetition(
      row.id,
      ({
        DRAFT: "compose",
        PENDING: "replies",
        COMPLETED: "replies",
      } as const)[row.status]
    );
  }, []);

  function goToPetition(
    id: string,
    section: "compose" | "replies" | "activity"
  ) {
    router.push(
      `/[locale]/app/petitions/[petitionId]/${section}`,
      `/${router.query.locale}/app/petitions/${id}/${section}`
    );
  }

  const columns = usePetitionsColumns();

  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "petitions.title",
          defaultMessage: "Petitions",
        })}
      </Title>
      <AppLayout user={me}>
        <Box padding={4} paddingBottom={24}>
          <TablePage
            columns={columns}
            rows={petitions.items}
            rowKeyProp={"id"}
            isSelectable
            isHighlightable
            loading={loading}
            onRowClick={handleRowClick}
            page={state.page}
            pageSize={PAGE_SIZE}
            totalCount={petitions.totalCount}
            sort={state.sort}
            onSelectionChange={setSelected}
            onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
            onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
            header={
              <PetitionListHeader
                search={state.search}
                status={state.status}
                showDelete={selected.length > 0}
                showClone={selected.length === 1}
                onSearchChange={handleSearchChange}
                onStatusChange={handleStatusChange}
                onDeleteClick={handleDeleteClick}
                onCreateClick={handleCreateClick}
                onReload={() => refetch()}
                onCloneClick={handleCloneClick}
              />
            }
            body={
              petitions.totalCount === 0 && !loading ? (
                state.search ? (
                  <Flex flex="1" alignItems="center" justifyContent="center">
                    <Text color="gray.300" fontSize="lg">
                      <FormattedMessage
                        id="petitions.no-results"
                        defaultMessage="There's no petitions matching your search"
                      />
                    </Text>
                  </Flex>
                ) : (
                  <Flex flex="1" alignItems="center" justifyContent="center">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="petitions.no-petitions"
                        defaultMessage="You have no petitions yet. Start by creating one now!"
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

type PetitionSelection = UnwrapArray<Petitions_PetitionsListFragment["items"]>;

function usePetitionsColumns(): TableColumn<PetitionSelection>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
          id: "petitions.header.name",
          defaultMessage: "Petition name",
        }),
        CellContent: ({ row }) => (
          <>
            {row.name || (
              <Text as="span" color="gray.400" fontStyle="italic">
                <FormattedMessage
                  id="generic.untitled-petition"
                  defaultMessage="Untitled petition"
                />
              </Text>
            )}
          </>
        ),
      },
      {
        key: "recipient",
        header: intl.formatMessage({
          id: "petitions.header.recipient",
          defaultMessage: "Recipient",
        }),
        CellContent: ({ row }) => {
          if (row.recipients.length === 0) {
            return null;
          }
          const [contact, ...rest] = row.recipients;
          if (contact) {
            return rest.length ? (
              <FormattedMessage
                id="petitions.recipients"
                defaultMessage="{contact} and <a>{more} more</a>"
                values={{
                  contact: (
                    <ContactLink
                      contact={contact}
                      onClick={(e: MouseEvent) => e.stopPropagation()}
                    />
                  ),
                  more: rest.length,
                  a: (...chunks: any[]) => (
                    <Link
                      href="/app/petitions/[petitionId]/activity"
                      as={`/app/petitions/${row.id}/activity`}
                      onClick={(e: MouseEvent) => e.stopPropagation()}
                    >
                      {chunks}
                    </Link>
                  ),
                }}
              />
            ) : (
              <ContactLink
                contact={contact}
                onClick={(e: MouseEvent) => e.stopPropagation()}
              />
            );
          } else {
            return <DeletedContact />;
          }
        },
      },
      {
        key: "deadline",
        header: intl.formatMessage({
          id: "petitions.header.deadline",
          defaultMessage: "Deadline",
        }),
        CellContent: ({ row: { deadline } }) =>
          deadline ? (
            <DateTime value={deadline} format={FORMATS.LLL} />
          ) : (
            <Text as="span" color="gray.400" fontStyle="italic">
              <FormattedMessage
                id="generic.no-deadline"
                defaultMessage="No deadline"
              />
            </Text>
          ),
      },
      {
        key: "progress",
        header: intl.formatMessage({
          id: "petitions.header.progress",
          defaultMessage: "Progress",
        }),
        CellContent: ({ row }) => (
          <PetitionProgressBar status={row.status} {...row.progress} />
        ),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "petitions.header.status",
          defaultMessage: "Status",
        }),
        CellContent: ({ row }) => <PetitionStatusText status={row.status} />,
      },
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "petitions.header.created-at",
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

function ConfirmDeletePetitionsDialog({
  selected,
  ...props
}: {
  selected: PetitionSelection[];
} & DialogCallbacks<void>) {
  const count = selected.length;
  const name = selected.length && selected[0].name;
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petitions.confirm-delete.header"
          defaultMessage="Delete petitions"
        />
      }
      body={
        <FormattedMessage
          id="petitions.confirm-delete.body"
          defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected petitions}}?"
          values={{
            count,
            name,
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

Petitions.fragments = {
  Petitions: gql`
    fragment Petitions_PetitionsList on PetitionPagination {
      items {
        id
        customRef
        name
        status
        deadline
        progress {
          validated
          replied
          optional
          total
        }
        createdAt
        recipients {
          ...ContactLink_Contact
        }
      }
      totalCount
    }
    ${ContactLink.fragments.Contact}
  `,
  User: gql`
    fragment Petitions_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};

Petitions.mutations = [
  gql`
    mutation Petitions_deletePetitions($ids: [ID!]!) {
      deletePetitions(ids: $ids)
    }
  `,
  gql`
    mutation Petitions_clonePetition($petitionId: ID!, $name: String) {
      clonePetition(petitionId: $petitionId, name: $name) {
        id
      }
    }
  `,
];

Petitions.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  const { page, search, sort, status } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    apollo.query<PetitionsQuery, PetitionsQueryVariables>({
      query: gql`
        query Petitions(
          $offset: Int!
          $limit: Int!
          $search: String
          $sortBy: [QueryPetitions_OrderBy!]
          $status: PetitionStatus
        ) {
          petitions(
            offset: $offset
            limit: $limit
            search: $search
            sortBy: $sortBy
            status: $status
          ) {
            ...Petitions_PetitionsList
          }
        }
        ${Petitions.fragments.Petitions}
      `,
      variables: {
        offset: PAGE_SIZE * (page - 1),
        limit: PAGE_SIZE,
        search,
        sortBy: [`${sort.field}_${sort.direction}` as QueryPetitions_OrderBy],
        status,
      },
    }),
    apollo.query<PetitionsUserQuery>({
      query: gql`
        query PetitionsUser {
          me {
            ...Petitions_User
          }
        }
        ${Petitions.fragments.User}
      `,
    }),
  ]);
};

export default compose(
  withOnboarding({
    key: "PETITIONS_LIST",
    steps: [
      {
        title: (
          <FormattedMessage
            id="tour.petitions-list.welcome"
            defaultMessage="Welcome to Parallel!"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.petitions-list.we-collect"
                defaultMessage="We are here to help you collect information from your clients."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petitions-list.show-around"
                defaultMessage="If this is your first time here, let us show you around!"
              />
            </Text>
          </>
        ),
        placement: "center",
        target: "#__next",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petitions-list.create-petition"
            defaultMessage="Let's start by creating a petition!"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.petitions-list.you-focus"
                defaultMessage="We want you to focus on what matters, so let us collect the information for you."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petitions-list.we-notify"
                defaultMessage="We will let you know when the recipients complete everything."
              />
            </Text>
          </>
        ),
        target: "#new-petition-button",
      },
    ],
  }),
  withData
)(Petitions);
