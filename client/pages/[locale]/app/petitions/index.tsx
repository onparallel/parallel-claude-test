import { Button, Flex, Text, Box } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DateTime } from "@parallel/components/common/DateTime";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { PetitionProgressBar } from "@parallel/components/common/PetitionProgressBar";
import { PetitionStatusText } from "@parallel/components/common/PetitionStatusText";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { Title } from "@parallel/components/common/Title";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { PetitionListHeader } from "@parallel/components/petitions/PetitionListHeader";
import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import {
  PetitionsQuery,
  PetitionsQueryVariables,
  PetitionStatus,
  PetitionsUserQuery,
  Petitions_PetitionsListFragment,
  usePetitionsQuery,
  usePetitionsUserQuery,
  usePetitions_deletePetitionsMutation,
  usePetitions_clonePetitionMutation,
} from "@parallel/graphql/__types";
import { assertQuery, clearCache } from "@parallel/utils/apollo";
import { FORMATS } from "@parallel/utils/dates";
import {
  enums,
  integer,
  parseQuery,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { UnwrapArray } from "@parallel/utils/types";
import { useCreatePetition } from "@parallel/utils/useCreatePetition";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { memo, useState, MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "@parallel/components/common/Link";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { useAskPetitionNameDialog } from "@parallel/components/petitions/AskPetitionNameDialog";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { compose } from "@parallel/utils/compose";

const PAGE_SIZE = 10;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  status: enums<PetitionStatus>(["DRAFT", "PENDING", "COMPLETED"]),
  search: string(),
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

  async function handleDeleteClick() {
    try {
      await confirmDelete({
        selected: petitions.items.filter((p) => selected!.includes(p.id)),
      });
      await deletePetition({
        variables: { ids: selected! },
      });
    } catch {}
  }

  async function handleCloneClick() {
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
  }

  async function handleCreateClick() {
    try {
      const id = await createPetition();
      if (state.status === null || state.status === "DRAFT") {
        refetch();
      }
      goToPetition(id, "compose");
    } catch {}
  }

  function handleRowClick(row: PetitionSelection) {
    goToPetition(
      row.id,
      ({
        DRAFT: "compose",
        PENDING: "replies",
        COMPLETED: "replies",
      } as const)[row.status]
    );
  }

  function handlePageChange(page: number) {
    setQueryState((current) => ({
      ...current,
      page,
    }));
  }

  function goToPetition(id: string, section: "compose" | "replies") {
    router.push(
      `/[locale]/app/petitions/[petitionId]/${section}`,
      `/${router.query.locale}/app/petitions/${id}/${section}`
    );
  }

  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "petitions.title",
          defaultMessage: "Petitions",
        })}
      </Title>
      <AppLayout user={me} onCreate={handleCreateClick}>
        <Box padding={4} paddingBottom={24}>
          <TablePage
            columns={COLUMNS}
            rows={petitions.items}
            rowKeyProp={"id"}
            selectable
            highlightable
            loading={loading}
            onRowClick={handleRowClick}
            page={state.page}
            pageSize={PAGE_SIZE}
            totalCount={petitions.totalCount}
            onSelectionChange={setSelected}
            onPageChange={handlePageChange}
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

const COLUMNS: TableColumn<PetitionSelection>[] = [
  {
    key: "name",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.name"
        defaultMessage="Petition name"
      />
    )),
    Cell: memo(({ row }) => (
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
    )),
  },
  // {
  //   key: "customRef",
  //   Header: memo(() => (
  //     <FormattedMessage
  //       id="petitions.header.custom-ref"
  //       defaultMessage="Reference"
  //     />
  //   )),
  //   Cell: memo(({ row }) => <>{row.customRef}</>),
  // },
  {
    key: "recipient",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.recipient"
        defaultMessage="Recipient"
      />
    )),
    Cell: memo(({ row }) => {
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
                  href="/app/petitions/[petitionId]/replies#sendouts"
                  as={`/app/petitions/${row.id}/replies/#sendouts`}
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
        return (
          <Text as="span" color="gray.400" fontStyle="italic">
            <FormattedMessage
              id="generic.deleted-contact"
              defaultMessage="Deleted contact"
            />
          </Text>
        );
      }
    }),
  },
  {
    key: "deadline",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.deadline"
        defaultMessage="Deadline"
      />
    )),
    Cell: memo(({ row: { deadline } }) => {
      if (deadline) {
        return <DateTime value={deadline} format={FORMATS.LLL} />;
      } else {
        return (
          <Text as="span" color="gray.400" fontStyle="italic">
            <FormattedMessage
              id="generic.no-deadline"
              defaultMessage="No deadline"
            />
          </Text>
        );
      }
    }),
  },
  {
    key: "progress",
    Header: memo(() => (
      <FormattedMessage
        id="petitions.header.progress"
        defaultMessage="Progress"
      />
    )),
    Cell: memo(({ row }) => (
      <PetitionProgressBar
        status={row.status}
        {...row.progress}
      ></PetitionProgressBar>
    )),
  },
  {
    key: "status",
    Header: memo(() => (
      <FormattedMessage id="petitions.header.status" defaultMessage="Status" />
    )),
    Cell: memo(({ row }) => <PetitionStatusText status={row.status} />),
  },
];

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
  petitions: gql`
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
        recipients {
          ...ContactLink_Contact
        }
      }
      totalCount
    }
    ${ContactLink.fragments.contact}
  `,
  user: gql`
    fragment Petitions_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.user}
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
  const { page, search, status } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    apollo.query<PetitionsQuery, PetitionsQueryVariables>({
      query: gql`
        query Petitions(
          $offset: Int!
          $limit: Int!
          $search: String
          $status: PetitionStatus
        ) {
          petitions(
            offset: $offset
            limit: $limit
            search: $search
            status: $status
          ) {
            ...Petitions_PetitionsList
          }
        }
        ${Petitions.fragments.petitions}
      `,
      variables: {
        offset: PAGE_SIZE * (page - 1),
        limit: PAGE_SIZE,
        search,
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
        ${Petitions.fragments.user}
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
