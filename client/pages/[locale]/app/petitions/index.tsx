import { gql } from "@apollo/client";
import { Box, Flex, Text } from "@chakra-ui/core";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { Link } from "@parallel/components/common/Link";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { PetitionProgressBar } from "@parallel/components/common/PetitionProgressBar";
import { PetitionStatusIcon } from "@parallel/components/common/PetitionStatusIcon";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useCreatePetitionDialog } from "@parallel/components/petition-list/CreatePetitionDialog";
import { PetitionListHeader } from "@parallel/components/petition-list/PetitionListHeader";
import {
  PetitionsQuery,
  PetitionsQueryVariables,
  PetitionStatus,
  PetitionsUserQuery,
  Petitions_PetitionPaginationFragment,
  QueryPetitions_OrderBy,
  usePetitionsQuery,
  usePetitionsUserQuery,
} from "@parallel/graphql/__types";
import {
  assertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { ellipsis } from "@parallel/utils/ellipsis";
import { useClonePetition } from "@parallel/utils/mutations/useClonePetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import {
  enums,
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { UnwrapArray } from "@parallel/utils/types";
import { useRouter } from "next/router";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";

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
  } = useAssertQueryOrPreviousData(
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

  const clonePetition = useClonePetition();

  const [selected, setSelected] = useState<string[]>([]);

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

  const deletePetitions = useDeletePetitions();
  const handleDeleteClick = useCallback(async () => {
    try {
      await deletePetitions(me.id, selected);
    } catch {}
    refetch();
  }, [petitions, selected]);

  const createPetitionDialog = useCreatePetitionDialog();
  const handleCloneClick = useCallback(
    async function () {
      try {
        const petition = petitions.items.find((p) => p.id === selected[0])!;
        const { name, locale, deadline } = await createPetitionDialog({
          defaultName: petition.name ?? undefined,
          defaultLocale: petition.locale,
        });
        const { data } = await clonePetition({
          variables: {
            petitionId: petition.id,
            name,
            locale,
            deadline: deadline?.toISOString() ?? null,
          },
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

  const createPetition = useCreatePetition();
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
    <AppLayout
      title={intl.formatMessage({
        id: "petitions.title",
        defaultMessage: "Petitions",
      })}
      user={me}
    >
      <Box
        padding={4}
        paddingBottom={{ base: 4, md: 24 }}
        minWidth="container.lg"
      >
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
        />
      </Box>
    </AppLayout>
  );
}

type PetitionSelection = UnwrapArray<
  Petitions_PetitionPaginationFragment["items"]
>;

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
            {row.name ? (
              ellipsis(row.name!, 50)
            ) : (
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
          const recipients = row.accesses
            .filter((a) => a.status === "ACTIVE")
            .map((a) => a.contact);
          if (recipients.length === 0) {
            return null;
          }
          const [contact, ...rest] = recipients;
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
                  a: (chunks: any[]) => (
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
            <Text
              as="span"
              color="gray.400"
              fontStyle="italic"
              whiteSpace="nowrap"
            >
              <FormattedMessage
                id="generic.no-deadline"
                defaultMessage="No deadline"
              />
            </Text>
          ),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "petitions.header.status",
          defaultMessage: "Status",
        }),
        align: "center",
        CellContent: ({ row, column }) => (
          <Flex alignItems="center">
            <PetitionProgressBar
              status={row.status}
              {...row.progress}
              flex="1"
              minWidth="80px"
            />
            <PetitionStatusIcon status={row.status} marginLeft={2} />
          </Flex>
        ),
      },
      {
        key: "shared-with",
        header: intl.formatMessage({
          id: "petitions.header.shared-with",
          defaultMessage: "Shared with",
        }),
        align: "center",
        CellContent: ({ row: { userPermissions }, column }) => (
          <Flex justifyContent={column.align}>
            <UserAvatarList users={userPermissions.map((p) => p.user)} />
          </Flex>
        ),
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
    [intl.locale]
  );
}

Petitions.fragments = {
  get PetitionPagination() {
    return gql`
      fragment Petitions_PetitionPagination on PetitionPagination {
        items {
          ...Petitions_Petition
        }
        totalCount
      }
      ${this.Petition}
      ${ContactLink.fragments.Contact}
    `;
  },
  get Petition() {
    return gql`
      fragment Petitions_Petition on Petition {
        id
        locale
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
        accesses {
          status
          contact {
            ...ContactLink_Contact
          }
        }
        userPermissions {
          permissionType
          user {
            ...UserAvatarList_User
          }
        }
      }
      ${UserAvatarList.fragments.User}
    `;
  },
  get User() {
    return gql`
      fragment Petitions_User on User {
        ...AppLayout_User
      }
      ${AppLayout.fragments.User}
    `;
  },
};

Petitions.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const { page, search, sort, status } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    fetchQuery<PetitionsQuery, PetitionsQueryVariables>(
      gql`
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
            ...Petitions_PetitionPagination
          }
        }
        ${Petitions.fragments.PetitionPagination}
      `,
      {
        variables: {
          offset: PAGE_SIZE * (page - 1),
          limit: PAGE_SIZE,
          search,
          sortBy: [`${sort.field}_${sort.direction}` as QueryPetitions_OrderBy],
          status,
        },
      }
    ),
    fetchQuery<PetitionsUserQuery>(gql`
      query PetitionsUser {
        me {
          ...Petitions_User
        }
      }
      ${Petitions.fragments.User}
    `),
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
                defaultMessage="We are here to help you collect and organize the documents and information you need, keeping everything under control."
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
  withApolloData
)(Petitions);
