import { gql } from "@apollo/client";
import { Flex, Stack, Text } from "@chakra-ui/react";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { TablePage } from "@parallel/components/common/TablePage";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/PetitionSharingDialog";
import { PetitionListHeader } from "@parallel/components/petition-list/PetitionListHeader";
import {
  PetitionBaseType,
  PetitionFilter,
  PetitionsQuery,
  PetitionsQueryVariables,
  PetitionStatus,
  PetitionsUserQuery,
  Petitions_PetitionBaseFragment,
  usePetitionsQuery,
  usePetitionsUserQuery,
} from "@parallel/graphql/__types";
import {
  assertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import {
  integer,
  parseQuery,
  QueryItem,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { usePetitionsTableColumns } from "@parallel/utils/usePetitionsTableColumns";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const SORTING = ["name", "createdAt", "sentAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  status: values<PetitionStatus>(["DRAFT", "PENDING", "COMPLETED", "CLOSED"]),
  type: values<PetitionBaseType>(["PETITION", "TEMPLATE"]).orDefault(
    "PETITION"
  ),
  search: string(),
  tags: new QueryItem<string[] | null>(
    (value) =>
      typeof value === "string"
        ? value === "NO_TAGS"
          ? []
          : value.split(",")
        : null,
    (value) => (value.length === 0 ? "NO_TAGS" : value.join(","))
  ),
  sort: sorting(SORTING),
};

function Petitions() {
  const intl = useIntl();

  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const sort =
    state.sort ??
    (state.type === "PETITION"
      ? ({ field: "sentAt", direction: "DESC" } as const)
      : ({ field: "createdAt", direction: "DESC" } as const));
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
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        filters: {
          status: state.status,
          type: state.type,
          tagIds: state.tags,
        },
        sortBy: [`${sort.field}_${sort.direction}`],
        hasPetitionSignature: me.hasPetitionSignature,
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

  function handleFilterChange(filter: PetitionFilter) {
    setQueryState((current) => ({
      ...current,
      status: filter.status,
      type: filter.type ?? undefined,
      tags: filter.tagIds,
      page: 1,
      // avoid invalid filter/sort combinations
      sort:
        filter.type === "TEMPLATE" && current.sort?.field === "sentAt"
          ? { ...current.sort, field: "createdAt" }
          : filter.type !== "TEMPLATE" && current.sort?.field === "createdAt"
          ? { ...current.sort, field: "sentAt" }
          : current.sort,
    }));
  }

  const deletePetitions = useDeletePetitions();
  const handleDeleteClick = useCallback(async () => {
    try {
      await deletePetitions(selected);
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

  const showPetitionSharingDialog = usePetitionSharingDialog();

  const handlePetitionSharingClick = async function () {
    try {
      await showPetitionSharingDialog({
        userId: me.id,
        petitionIds: selected,
        isTemplate: petitions.items[0].__typename === "PetitionTemplate",
      });
    } catch {}
  };
  const handleRowClick = useCallback(function (
    row: PetitionSelection,
    event: MouseEvent
  ) {
    goToPetition(
      row.id,
      row.__typename === "Petition"
        ? (
            {
              DRAFT: "compose",
              PENDING: "replies",
              COMPLETED: "replies",
              CLOSED: "replies",
            } as const
          )[row.status]
        : "compose",
      event
    );
  },
  []);

  const columns = usePetitionsTableColumns(
    petitions.items.length > 0
      ? petitions.items[0].__typename === "Petition"
        ? "PETITION"
        : "TEMPLATE"
      : state.type
  );

  const context = useMemo(() => ({ user: me! }), [me]);

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
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          columns={columns}
          rows={petitions.items}
          context={context}
          rowKeyProp={"id"}
          isSelectable
          isHighlightable
          loading={loading}
          onRowClick={handleRowClick}
          page={state.page}
          pageSize={state.items}
          totalCount={petitions.totalCount}
          sort={sort}
          onSelectionChange={setSelected}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <PetitionListHeader
              filter={{
                status: state.status,
                type: state.type,
                tagIds: state.tags,
              }}
              search={state.search}
              selectedCount={selected.length}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onDeleteClick={handleDeleteClick}
              onCloneAsTemplateClick={handleCloneAsTemplate}
              onUseTemplateClick={handleUseTemplateClick}
              onReload={() => refetch()}
              onCloneClick={handleCloneClick}
              onShareClick={handlePetitionSharingClick}
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
      </Flex>
    </AppLayout>
  );
}

export type PetitionSelection = Petitions_PetitionBaseFragment;

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
        ...usePetitionsTableColumns_PetitionBase
      }
      ${usePetitionsTableColumns.fragments.PetitionBase}
    `;
  },
  get User() {
    return gql`
      fragment Petitions_User on User {
        ...AppLayout_User
        ...usePetitionsTableColumns_User
      }
      ${AppLayout.fragments.User}
      ${usePetitionsTableColumns.fragments.User}
    `;
  },
};

Petitions.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const {
    data: { me },
  } = await fetchQuery<PetitionsUserQuery>(gql`
    query PetitionsUser {
      me {
        ...Petitions_User
      }
    }
    ${Petitions.fragments.User}
  `);
  const state = parseQuery(query, QUERY_STATE);
  const sort =
    state.sort ??
    (state.type === "PETITION"
      ? ({ field: "sentAt", direction: "DESC" } as const)
      : ({ field: "createdAt", direction: "DESC" } as const));
  await fetchQuery<PetitionsQuery, PetitionsQueryVariables>(
    gql`
      query Petitions(
        $offset: Int!
        $limit: Int!
        $search: String
        $sortBy: [QueryPetitions_OrderBy!]
        $hasPetitionSignature: Boolean!
        $filters: PetitionFilter
      ) {
        petitions(
          offset: $offset
          limit: $limit
          search: $search
          sortBy: $sortBy
          filters: $filters
        ) {
          ...Petitions_PetitionBasePagination
        }
      }
      ${Petitions.fragments.PetitionBasePagination}
    `,
    {
      variables: {
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        sortBy: [`${sort.field}_${sort.direction}`],
        filters: { type: state.type, status: state.status, tagIds: state.tags },
        hasPetitionSignature: me.hasPetitionSignature,
      },
    }
  );
};

export default compose(
  withOnboarding({
    key: "PETITIONS_LIST",
    steps: [
      {
        title: (
          <FormattedMessage
            id="tour.petitions-list.welcome-title"
            defaultMessage="Welcome to Parallel!"
          />
        ),
        content: (
          <Stack>
            <Text>
              <FormattedMessage
                id="tour.petitions-list.welcome-content-1"
                defaultMessage="We are here to help you collect and organize the documents and information you need, keeping everything under control."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="tour.petitions-list.welcome-content-2"
                defaultMessage="If this is your first time here, let us show you around!"
              />
            </Text>
          </Stack>
        ),
        placement: "center",
        target: "#__next",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petitions-list.create-petition-title"
            defaultMessage="Let's start by creating a petition!"
          />
        ),
        content: (
          <Stack>
            <Text>
              <FormattedMessage
                id="tour.petitions-list.create-petition-content-1"
                defaultMessage="We want you to focus on what matters, so let us collect the information for you."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="tour.petitions-list.create-petition-content-2"
                defaultMessage="We will let you know when the recipients complete everything."
              />
            </Text>
          </Stack>
        ),
        placement: "right-start",
        target: "#menu-button-create-petition",
      },
    ],
  }),
  withDialogs,
  withApolloData
)(Petitions);
