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
import { PetitionListHeader } from "@parallel/components/petition-list/PetitionListHeader";
import {
  PetitionBaseType,
  PetitionsQuery,
  PetitionsQueryVariables,
  PetitionStatus,
  PetitionsUserQuery,
  Petitions_PetitionBasePaginationFragment,
  QueryPetitions_OrderBy,
  usePetitionsQuery,
  usePetitionsUserQuery,
  Petitions_PetitionBase_PetitionTemplate_Fragment,
} from "@parallel/graphql/__types";
import {
  assertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { ellipsis } from "@parallel/utils/ellipsis";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import {
  enums,
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { UnwrapArray } from "@parallel/utils/types";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useRouter } from "next/router";

const PAGE_SIZE = 10;

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  status: enums<PetitionStatus>(["DRAFT", "PENDING", "COMPLETED"]),
  type: enums<PetitionBaseType>(["PETITION", "TEMPLATE"]).orDefault("PETITION"),
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
        type: state.type,
        sortBy: [
          `${state.sort.field}_${state.sort.direction}` as QueryPetitions_OrderBy,
        ],
      },
    })
  );

  const [selected, setSelected] = useState<string[]>([]);

  function handleSearchChange(value: string | null) {
    setQueryState((current) => ({
      ...current,
      search: value,
      page: 1,
    }));
  }

  function handleFilterChange({
    status,
    type,
  }: Pick<typeof state, "status" | "type">) {
    setQueryState((current) => ({
      ...current,
      status,
      type,
      page: 1,
    }));
  }

  const deletePetitions = useDeletePetitions();
  const handleDeleteClick = useCallback(async () => {
    try {
      await deletePetitions(me.id, selected);
    } catch {}
    refetch();
  }, [intl.locale, petitions, selected]);

  const goToPetition = useGoToPetition();

  const createPetition = useCreatePetition();

  const handleCloneAsTemplate = useCallback(
    async function () {
      try {
        const templateId = await createPetition({
          petitionId: selected[0],
          type: "TEMPLATE",
        });
        goToPetition(templateId, "compose");
      } catch {}
    },
    [petitions, selected]
  );

  const handleUseTemplateClick = useCallback(
    async function () {
      try {
        const petitionId = await createPetition({
          petitionId: selected[0],
        });
        goToPetition(petitionId, "compose");
      } catch {}
    },
    [petitions, selected]
  );

  const handleCreatePetition = useCallback(async () => {
    try {
      if (state.type === "TEMPLATE") {
        const templateId = await createPetition({
          type: "TEMPLATE",
        });
        goToPetition(templateId, "compose");
      } else {
        router.push(
          `/[locale]/app/petitions/new`,
          `/${router.query.locale}/app/petitions/new`
        );
      }
    } catch {}
  }, [state.type]);

  const clonePetitions = useClonePetitions();
  const handleCloneClick = useCallback(
    async function () {
      try {
        const petitionIds = await clonePetitions({
          petitionIds: selected,
        });
        if (petitionIds.length === 1) {
          goToPetition(petitionIds[0], "compose");
        } else {
          refetch();
        }
      } catch {}
    },
    [petitions, selected]
  );

  const handleRowClick = useCallback(function (row: PetitionSelection) {
    goToPetition(
      row.id,
      row.__typename === "Petition"
        ? ({
            DRAFT: "compose",
            PENDING: "replies",
            COMPLETED: "replies",
          } as const)[row.status]
        : "compose"
    );
  }, []);

  const columns = usePetitionsColumns(state.type);

  return (
    <AppLayout
      title={
        state.type === "PETITION"
          ? intl.formatMessage({
              id: "petitions.title",
              defaultMessage: "Petitions",
            })
          : intl.formatMessage({
              id: "petitions.title-templates",
              defaultMessage: "Templates",
            })
      }
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
              type={state.type}
              selectedCount={selected.length}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onDeleteClick={handleDeleteClick}
              onCloneAsTemplateClick={handleCloneAsTemplate}
              onUseTemplateClick={handleUseTemplateClick}
              onReload={() => refetch()}
              onCloneClick={handleCloneClick}
              onCreatePetition={handleCreatePetition}
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
                    {state.type === "TEMPLATE" ? (
                      <FormattedMessage
                        id="petitions.no-templates"
                        defaultMessage="You have no templates yet. Start by creating one now!"
                      />
                    ) : (
                      <FormattedMessage
                        id="petitions.no-petitions"
                        defaultMessage="You have no petitions yet. Start by creating one now!"
                      />
                    )}
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
  Petitions_PetitionBasePaginationFragment["items"]
>;

function usePetitionsColumns(
  type: PetitionBaseType
): TableColumn<PetitionSelection>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header:
          type === "PETITION"
            ? intl.formatMessage({
                id: "petitions.header.name",
                defaultMessage: "Petition name",
              })
            : intl.formatMessage({
                id: "petitions.header.template-name",
                defaultMessage: "Template name",
              }),
        CellContent: ({ row }) => (
          <>
            {row.name ? (
              ellipsis(row.name!, 50)
            ) : (
              <Text as="span" textStyle="hint" whiteSpace="nowrap">
                {type === "PETITION" ? (
                  <FormattedMessage
                    id="generic.untitled-petition"
                    defaultMessage="Untitled petition"
                  />
                ) : (
                  <FormattedMessage
                    id="generic.untitled-template"
                    defaultMessage="Untitled template"
                  />
                )}
              </Text>
            )}
          </>
        ),
      },
      ...(type === "PETITION"
        ? ([
            {
              key: "recipient",
              header: intl.formatMessage({
                id: "petitions.header.recipient",
                defaultMessage: "Recipient",
              }),
              CellContent: ({ row }) => {
                if (row.__typename === "Petition") {
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
                } else {
                  return null;
                }
              },
            },
            {
              key: "status",
              header: intl.formatMessage({
                id: "petitions.header.status",
                defaultMessage: "Status",
              }),
              align: "center",
              CellContent: ({ row }) =>
                row.__typename === "Petition" ? (
                  <Flex alignItems="center">
                    <PetitionProgressBar
                      status={row.status}
                      {...row.progress}
                      flex="1"
                      minWidth="80px"
                    />
                    <PetitionStatusIcon status={row.status} marginLeft={2} />
                  </Flex>
                ) : null,
            },
          ] as TableColumn<PetitionSelection>[])
        : ([
            {
              key: "description",
              header: intl.formatMessage({
                id: "petitions.header.description",
                defaultMessage: "Description",
              }),
              align: "left",
              CellContent: ({ row }) => {
                const templateRow = row as Petitions_PetitionBase_PetitionTemplate_Fragment;
                return (
                  <>
                    {templateRow.description &&
                      ellipsis(templateRow.description!, 80)}
                  </>
                );
              },
            },
          ] as TableColumn<PetitionSelection>[])),
      {
        key: "shared-with",
        header: intl.formatMessage({
          id: "petitions.header.shared-with",
          defaultMessage: "Shared with",
        }),
        align: "center",
        cellProps: { width: "1%" },
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
        cellProps: { width: "1%" },
        CellContent: ({ row: { createdAt } }) => (
          <DateTime
            value={createdAt}
            format={FORMATS.LLL}
            useRelativeTime
            whiteSpace="nowrap"
          />
        ),
      },
    ],
    [intl.locale, type]
  );
}

Petitions.fragments = {
  get PetitionBasePagination() {
    return gql`
      fragment Petitions_PetitionBasePagination on PetitionBasePagination {
        items {
          ...Petitions_PetitionBase
        }
        totalCount
      }
      ${this.PetitionBase}
      ${ContactLink.fragments.Contact}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment Petitions_PetitionBase on PetitionBase {
        id
        locale
        name
        createdAt
        userPermissions {
          permissionType
          user {
            ...UserAvatarList_User
          }
        }
        owner {
          id
        }
        ... on Petition {
          accesses {
            status
            contact {
              ...ContactLink_Contact
            }
          }
          status
          progress {
            validated
            replied
            optional
            total
          }
        }
        ... on PetitionTemplate {
          description
        }
      }
      ${UserAvatarList.fragments.User}
      ${ContactLink.fragments.Contact}
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
  const { page, search, sort, status, type } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    fetchQuery<PetitionsQuery, PetitionsQueryVariables>(
      gql`
        query Petitions(
          $offset: Int!
          $limit: Int!
          $search: String
          $sortBy: [QueryPetitions_OrderBy!]
          $status: PetitionStatus
          $type: PetitionBaseType
        ) {
          petitions(
            offset: $offset
            limit: $limit
            search: $search
            sortBy: $sortBy
            type: $type
            status: $status
          ) {
            ...Petitions_PetitionBasePagination
          }
        }
        ${Petitions.fragments.PetitionBasePagination}
      `,
      {
        variables: {
          offset: PAGE_SIZE * (page - 1),
          limit: PAGE_SIZE,
          search,
          sortBy: [`${sort.field}_${sort.direction}` as QueryPetitions_OrderBy],
          type,
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
