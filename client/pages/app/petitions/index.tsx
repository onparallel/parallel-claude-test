import { gql, useMutation } from "@apollo/client";
import { Box, Flex, Select, Text } from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  EditSimpleIcon,
  PaperPlaneIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import { useRenameDialog } from "@parallel/components/petition-common/dialogs/RenameDialog";
import {
  flatShared,
  removeInvalidLines,
  unflatShared,
} from "@parallel/components/petition-list/filters/shared-with/PetitionListSharedWithFilter";
import { PetitionListHeader } from "@parallel/components/petition-list/PetitionListHeader";
import {
  PetitionBaseType,
  PetitionSharedWithFilter,
  PetitionStatus,
  Petitions_PetitionBaseFragment,
  Petitions_petitionsDocument,
  Petitions_updatePetitionDocument,
  Petitions_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import {
  integer,
  list,
  object,
  QueryItem,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { usePetitionsTableColumns } from "@parallel/utils/usePetitionsTableColumns";
import { useSelection } from "@parallel/utils/useSelectionState";
import { ValueProps } from "@parallel/utils/ValueProps";
import { MouseEvent, PropsWithChildren, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";

const SORTING = ["name", "createdAt", "sentAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  status: list<PetitionStatus>(["DRAFT", "PENDING", "COMPLETED", "CLOSED"]),
  type: values<PetitionBaseType>(["PETITION", "TEMPLATE"]).orDefault("PETITION"),
  search: string(),
  tags: new QueryItem<string[] | null>(
    (value) => (typeof value === "string" ? (value === "NO_TAGS" ? [] : value.split(",")) : null),
    (value) => (value.length === 0 ? "NO_TAGS" : value.join(","))
  ),
  sort: sorting(SORTING),
  sharedWith: object<PetitionSharedWithFilter>({
    flatten: flatShared,
    unflatten: unflatShared,
  }),
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
    data: { me, realMe },
  } = useAssertQuery(Petitions_userDocument);
  const { data, loading, refetch } = useQueryOrPreviousData(
    Petitions_petitionsDocument,
    {
      variables: {
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        filters: {
          status: state.status,
          type: state.type,
          tagIds: state.tags,
          sharedWith: removeInvalidLines(state.sharedWith),
        },
        sortBy: [`${sort.field}_${sort.direction}`],
      },
      fetchPolicy: "cache-and-network",
    },
    (prev, curr) => prev?.variables?.filters?.type === curr?.variables?.filters?.type
  );

  const petitions = data?.petitions;

  const { selectedIdsRef, selectedRowsRef, selectedIds, onChangeSelectedIds } = useSelection(
    petitions?.items,
    "id"
  );

  function handleSearchChange(value: string | null) {
    setQueryState((current) => ({
      ...current,
      search: value,
      page: 1,
    }));
  }

  function handleTypeChange(type: PetitionBaseType) {
    setQueryState((current) => ({
      ...current,
      status: null,
      type,
      page: 1,
      // avoid invalid filter/sort combinations
      sort:
        type === "TEMPLATE" && current.sort?.field === "sentAt"
          ? { ...current.sort, field: "createdAt" }
          : type !== "TEMPLATE" && current.sort?.field === "createdAt"
          ? { ...current.sort, field: "sentAt" }
          : current.sort,
    }));
  }

  const deletePetitions = useDeletePetitions();
  const handleDeleteClick = useCallback(async () => {
    try {
      await deletePetitions(selectedIdsRef.current);
    } catch {}
    refetch();
  }, []);

  const goToPetition = useGoToPetition();

  const createPetition = useCreatePetition();

  const handleCloneAsTemplate = useCallback(async function () {
    try {
      const templateId = await createPetition({
        petitionId: selectedIdsRef.current[0],
        type: "TEMPLATE",
      });
      goToPetition(templateId, "compose", { query: { new: "true" } });
    } catch {}
  }, []);

  const handleUseTemplateClick = useCallback(async function () {
    try {
      const petitionId = await createPetition({
        petitionId: selectedIdsRef.current[0],
      });
      goToPetition(petitionId, "preview", {
        query: { new: "true", fromTemplate: "true" },
      });
    } catch {}
  }, []);

  const clonePetitions = useClonePetitions();
  const handleCloneClick = useCallback(async function () {
    try {
      const petitionIds = await clonePetitions({
        petitionIds: selectedIdsRef.current,
      });
      if (petitionIds.length === 1) {
        goToPetition(petitionIds[0], "compose", { query: { new: "true" } });
      } else {
        refetch();
      }
    } catch {}
  }, []);

  const showPetitionSharingDialog = usePetitionSharingDialog();

  const handlePetitionSharingClick = useCallback(
    async function () {
      try {
        await showPetitionSharingDialog({
          userId: me.id,
          petitionIds: selectedIdsRef.current,
          isTemplate: state.type === "TEMPLATE",
        });
      } catch {}
    },
    [state.type]
  );

  const handleRowClick = useCallback(
    function (row: PetitionSelection, event: MouseEvent) {
      goToPetition(
        row.id,
        row.__typename === "Petition"
          ? (
              {
                DRAFT: "preview",
                PENDING: "replies",
                COMPLETED: "replies",
                CLOSED: "replies",
              } as const
            )[row.status]
          : "compose",
        { event }
      );
    },
    [state.type]
  );

  const [updatePetition] = useMutation(Petitions_updatePetitionDocument);
  const showRenameDialog = useRenameDialog();

  const handleRenameClick = useCallback(async () => {
    try {
      const petition = selectedRowsRef.current[0];
      if (petition) {
        const isPublic = petition.__typename === "PetitionTemplate" && petition.isPublic;
        const { newName } = await showRenameDialog({
          name: petition.name,
          isTemplate: petition.__typename === "PetitionTemplate",
          isDisabled: isPublic || petition.myEffectivePermission?.permissionType === "READ",
        });
        await updatePetition({
          variables: {
            petitionId: petition.id,
            data: { name: newName },
          },
        });
      }
    } catch {}
  }, []);

  const columns = usePetitionsTableColumns(state.type);

  const context = useMemo(() => ({ user: me! }), [me]);

  const actions = usePetitionListActions({
    user: me,
    type: state.type,
    selectedCount: selectedIds.length,
    onRenameClick: handleRenameClick,
    onDeleteClick: handleDeleteClick,
    onCloneAsTemplateClick: handleCloneAsTemplate,
    onUseTemplateClick: handleUseTemplateClick,
    onCloneClick: handleCloneClick,
    onShareClick: handlePetitionSharingClick,
  });

  return (
    <AppLayout
      title={
        state.type === "PETITION"
          ? intl.formatMessage({
              id: "petitions.title",
              defaultMessage: "Parallels",
            })
          : intl.formatMessage({
              id: "petitions.title-templates",
              defaultMessage: "Templates",
            })
      }
      me={me}
      realMe={realMe}
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          columns={columns}
          rows={petitions?.items}
          context={context}
          rowKeyProp={"id"}
          isSelectable
          isHighlightable
          loading={loading}
          onRowClick={handleRowClick}
          page={state.page}
          pageSize={state.items}
          totalCount={petitions?.totalCount}
          sort={sort}
          filter={pick(state, ["sharedWith", "status", "tags"])}
          onFilterChange={(key, value) => {
            setQueryState((current) => ({ ...current, [key]: value, page: 1 }));
          }}
          onSelectionChange={onChangeSelectedIds}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          actions={actions}
          header={
            <PetitionListHeader
              search={state.search}
              onSearchChange={handleSearchChange}
              onReload={() => refetch()}
            />
          }
          body={
            data?.petitions.totalCount === 0 && !loading ? (
              state.search || state.sharedWith || state.tags || state.status ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="petitions.no-results"
                      defaultMessage="There's no parallels matching your criteria"
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
                        id="petitions.no-parallels"
                        defaultMessage="You have no parallels yet. Start by creating one now!"
                      />
                    )}
                  </Text>
                </Flex>
              )
            ) : null
          }
          Footer={RenderFooter}
          footerProps={{
            value: state.type,
            onChange: handleTypeChange,
          }}
        />
      </Flex>
    </AppLayout>
  );
}

function RenderFooter({
  children,
  value,
  onChange,
}: PropsWithChildren<ValueProps<PetitionBaseType, false>>) {
  const intl = useIntl();
  return (
    <>
      <Box>
        <Select
          size="sm"
          variant="unstyled"
          value={value}
          onChange={(e) => onChange(e.target.value as PetitionBaseType)}
          display="flex"
          alignItems="center"
        >
          <option value="PETITION">
            {intl.formatMessage({
              id: "generic.parallel-type-plural",
              defaultMessage: "Parallels",
            })}
          </option>
          <option value="TEMPLATE">
            {intl.formatMessage({
              id: "generic.template-type-plural",
              defaultMessage: "Templates",
            })}
          </option>
        </Select>
      </Box>
      {children}
    </>
  );
}

export type PetitionSelection = Petitions_PetitionBaseFragment;

Petitions.fragments = {
  get User() {
    return gql`
      fragment Petitions_User on User {
        role
      }
    `;
  },
  get PetitionBasePagination() {
    return gql`
      fragment Petitions_PetitionBasePagination on PetitionBasePagination {
        items {
          ...Petitions_PetitionBase
        }
        totalCount
      }
      ${this.PetitionBase}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment Petitions_PetitionBase on PetitionBase {
        ...usePetitionsTableColumns_PetitionBase
        ... on PetitionTemplate {
          isPublic
        }
        myEffectivePermission {
          permissionType
        }
      }
      ${usePetitionsTableColumns.fragments.PetitionBase}
    `;
  },
};

const _queries = [
  gql`
    query Petitions_user {
      ...AppLayout_Query
      me {
        ...PetitionListHeader_User
      }
    }
    ${AppLayout.fragments.Query}
    ${PetitionListHeader.fragments.User}
  `,
  gql`
    query Petitions_petitions(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [QueryPetitions_OrderBy!]
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
];

const _mutations = [
  gql`
    mutation Petitions_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        id
        name
      }
    }
  `,
];

function usePetitionListActions({
  user,
  type,
  selectedCount,
  onRenameClick,
  onShareClick,
  onCloneClick,
  onCloneAsTemplateClick,
  onUseTemplateClick,
  onDeleteClick,
}: {
  user: any;
  type: PetitionBaseType;
  selectedCount: number;
  onRenameClick: () => void;
  onShareClick: () => void;
  onCloneClick: () => void;
  onCloneAsTemplateClick: () => void;
  onUseTemplateClick: () => void;
  onDeleteClick: () => void;
}) {
  return [
    {
      key: "rename",
      onClick: onRenameClick,
      isDisabled: selectedCount !== 1,
      leftIcon: <EditSimpleIcon />,
      children: (
        <FormattedMessage id="page.petitions-list.actions-rename" defaultMessage="Rename" />
      ),
    },
    {
      key: "share",
      onClick: onShareClick,
      leftIcon: <UserArrowIcon />,
      children: <FormattedMessage id="page.petitions-list.actions-share" defaultMessage="Share" />,
    },
    ...(user.role === "COLLABORATOR"
      ? []
      : [
          {
            key: "clone",
            onClick: onCloneClick,
            leftIcon: <CopyIcon />,
            children: (
              <FormattedMessage id="page.petitions-list.actions-clone" defaultMessage="Duplicate" />
            ),
          },
        ]),
    type === "PETITION"
      ? {
          key: "saveAsTemplate",
          onClick: onCloneAsTemplateClick,
          isDisabled: selectedCount !== 1,
          leftIcon: <CopyIcon />,
          children: (
            <FormattedMessage
              id="page.petitions-list.actions-save-as-template"
              defaultMessage="Save as template"
            />
          ),
        }
      : {
          key: "useTemplate",
          onClick: onUseTemplateClick,
          isDisabled: selectedCount !== 1,
          leftIcon: <PaperPlaneIcon />,
          children: (
            <FormattedMessage id="generic.create-petition" defaultMessage="Create parallel" />
          ),
        },
    {
      key: "delete",
      onClick: onDeleteClick,
      leftIcon: <DeleteIcon />,
      children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
      colorScheme: "red",
    },
  ];
}

Petitions.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Petitions_userDocument);
};

export default compose(withDialogs, withApolloData)(Petitions);
