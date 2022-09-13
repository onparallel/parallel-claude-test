import { gql, useMutation } from "@apollo/client";
import { Box, Flex, Select, Text } from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  EditSimpleIcon,
  FolderIcon,
  PaperPlaneIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { SearchInOptions } from "@parallel/components/common/SearchAllOrCurrentFolder";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useMoveToFolderDialog } from "@parallel/components/petition-common/dialogs/MoveToFolderDialog";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import { useRenameDialog } from "@parallel/components/petition-common/dialogs/RenameDialog";
import { EmptyFolderIllustration } from "@parallel/components/petition-common/EmptyFolderIllustration";
import {
  flatShared,
  removeInvalidLines,
  unflatShared,
} from "@parallel/components/petition-list/filters/shared-with/PetitionListSharedWithFilter";
import { PetitionListHeader } from "@parallel/components/petition-list/PetitionListHeader";
import {
  PetitionBaseType,
  PetitionPermissionType,
  PetitionSharedWithFilter,
  PetitionStatus,
  Petitions_movePetitionsDocument,
  Petitions_PetitionBaseOrFolderFragment,
  Petitions_petitionsDocument,
  Petitions_updatePetitionDocument,
  Petitions_userDocument,
} from "@parallel/graphql/__types";
import { isTypename } from "@parallel/utils/apollo/typename";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import {
  integer,
  object,
  QueryItem,
  QueryStateFrom,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { usePetitionsTableColumns } from "@parallel/utils/usePetitionsTableColumns";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { ValueProps } from "@parallel/utils/ValueProps";
import { MouseEvent, PropsWithChildren, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { map, maxBy, pick, pipe } from "remeda";

const SORTING = ["name", "createdAt", "sentAt"] as const;

const QUERY_STATE = {
  path: string()
    .withValidation((value) => typeof value === "string" && /^\/([^\/]+\/)*$/.test(value))
    .orDefault("/"),
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  status: values<PetitionStatus>(["DRAFT", "PENDING", "COMPLETED", "CLOSED"]).list(),
  type: values<PetitionBaseType>(["PETITION", "TEMPLATE"]).orDefault("PETITION"),
  search: string(),
  searchIn: values<SearchInOptions>(["EVERYWHERE", "CURRENT_FOLDER"]).orDefault("EVERYWHERE"),
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

export type PetitionsQueryState = QueryStateFrom<typeof QUERY_STATE>;

function rowKeyProp(row: PetitionSelection) {
  return row.__typename === "PetitionFolder" ? row.folderId : (row as any).id;
}

function Petitions() {
  const intl = useIntl();

  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const stateRef = useUpdatingRef(state);
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
          path: state.search && state.searchIn === "EVERYWHERE" ? null : state.path,
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

  const { selectedIdsRef, selectedRows, selectedRowsRef, onChangeSelectedIds } = useSelection(
    petitions?.items,
    rowKeyProp
  );

  function handleTypeChange(type: PetitionBaseType) {
    setQueryState((current) => ({
      ...current,
      status: null,
      path: "/",
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
      await deletePetitions(selectedRowsRef.current, stateRef.current.type, stateRef.current.path);
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

  const handlePetitionSharingClick = async function () {
    try {
      await showPetitionSharingDialog({
        userId: me.id,
        petitionIds: selectedRowsRef.current
          .filter((c) => c.__typename !== "PetitionFolder")
          .map((p) => (p as any).id as string),
        folderIds: selectedRowsRef.current
          .filter((c) => c.__typename === "PetitionFolder")
          .map((p) => (p as any).folderId as string),
        type: state.type,
        currentPath: stateRef.current.path,
      });
    } catch {}
  };
  const handleRowClick = useCallback(function (row: PetitionSelection, event: MouseEvent) {
    if (row.__typename === "PetitionFolder") {
      setQueryState(
        (current) => ({
          ...current,
          path: row.path,
          page: 1,
        }),
        { type: "push", event }
      );
    } else if (row.__typename === "Petition" || row.__typename === "PetitionTemplate") {
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
    }
  }, []);

  const [updatePetition] = useMutation(Petitions_updatePetitionDocument);
  const [movePetitions] = useMutation(Petitions_movePetitionsDocument);
  const showRenameDialog = useRenameDialog();

  const handleRenameClick = useCallback(async () => {
    try {
      const row = selectedRowsRef.current[0];
      if (row.__typename === "PetitionFolder") {
        const newName = await showRenameDialog({
          name: row.folderName,
          type: row.__typename,
          isDisabled: false,
        });

        await movePetitions({
          variables: {
            folderIds: [row.folderId],
            source: stateRef.current.path,
            destination: stateRef.current.path.concat(newName, "/"),
            type: stateRef.current.type,
          },
          onCompleted: () => {
            refetch();
          },
        });
      } else if (row.__typename === "Petition" || row.__typename === "PetitionTemplate") {
        const petition = row;
        if (petition) {
          const isPublic = petition.__typename === "PetitionTemplate" && petition.isPublic;
          const newName = await showRenameDialog({
            name: petition.name,
            type: petition.__typename,
            isDisabled: isPublic || petition.myEffectivePermission?.permissionType === "READ",
          });
          await updatePetition({
            variables: {
              petitionId: petition.id,
              data: { name: newName },
            },
          });
        }
      }
    } catch {}
  }, []);

  const showMoveFolderDialog = useMoveToFolderDialog();
  const handleMoveToClick = useCallback(async () => {
    try {
      const destinationPath = await showMoveFolderDialog({
        type: stateRef.current.type,
        currentPath: stateRef.current.path,
        disabledPaths: selectedRowsRef.current
          .filter(isTypename("PetitionFolder"))
          .map((r) => r.path),
      });
      await movePetitions({
        variables: {
          ids: selectedRowsRef.current
            .filter((r) => r.__typename !== "PetitionFolder")
            .map(rowKeyProp),
          folderIds: selectedRowsRef.current
            .filter((r) => r.__typename === "PetitionFolder")
            .map(rowKeyProp),
          source: stateRef.current.path,
          destination: destinationPath,
          type: stateRef.current.type,
        },
        onCompleted: () => {
          refetch();
        },
      });
    } catch {}
  }, []);

  const columns = usePetitionsTableColumns(state.type);

  const context = useMemo(() => ({ user: me! }), [me]);

  const minimumPermission = useMemo(() => {
    return pipe(
      selectedRows,
      map((r) =>
        r.__typename === "PetitionFolder"
          ? r.minimumPermissionType
          : r.__typename === "Petition" || r.__typename === "PetitionTemplate"
          ? r.myEffectivePermission!.permissionType
          : (null as never)
      ),
      maxBy((p) => ["OWNER", "WRITE", "READ"].indexOf(p))
    )!;
  }, [selectedRows]);

  const actions = usePetitionListActions({
    user: me,
    type: state.type,
    selectedCount: selectedRows.length,
    hasSelectedFolders: selectedRows.some((c) => c.__typename === "PetitionFolder"),
    minimumPermission,
    onRenameClick: handleRenameClick,
    onDeleteClick: handleDeleteClick,
    onCloneAsTemplateClick: handleCloneAsTemplate,
    onUseTemplateClick: handleUseTemplateClick,
    onCloneClick: handleCloneClick,
    onShareClick: handlePetitionSharingClick,
    onMoveToClick: handleMoveToClick,
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
          rowKeyProp={rowKeyProp}
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
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
          actions={actions}
          header={
            <PetitionListHeader
              shape={QUERY_STATE}
              state={state}
              onStateChange={setQueryState}
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
              ) : state.path !== "/" ? (
                <EmptyFolderIllustration flex="1" isTemplate={state.type === "TEMPLATE"} />
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

export type PetitionSelection = Petitions_PetitionBaseOrFolderFragment;

Petitions.fragments = {
  User: gql`
    fragment Petitions_User on User {
      role
    }
  `,
  PetitionBaseOrFolder: gql`
    fragment Petitions_PetitionBaseOrFolder on PetitionBaseOrFolder {
      ...useDeletePetitions_PetitionBaseOrFolder
      ... on PetitionBase {
        ...usePetitionsTableColumns_PetitionBase
        myEffectivePermission {
          permissionType
        }
      }
      ... on PetitionTemplate {
        isPublic
      }
      ... on PetitionFolder {
        ...usePetitionsTableColumns_PetitionFolder
        path
        minimumPermissionType
      }
    }
    ${useDeletePetitions.fragments.PetitionBaseOrFolder}
    ${usePetitionsTableColumns.fragments.PetitionBase}
    ${usePetitionsTableColumns.fragments.PetitionFolder}
  `,
};

const _queries = [
  gql`
    query Petitions_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
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
        items {
          ...Petitions_PetitionBaseOrFolder
        }
        totalCount
      }
    }
    ${Petitions.fragments.PetitionBaseOrFolder}
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
  gql`
    mutation Petitions_movePetitions(
      $ids: [GID!]
      $folderIds: [ID!]
      $source: String!
      $destination: String!
      $type: PetitionBaseType!
    ) {
      movePetitions(
        ids: $ids
        folderIds: $folderIds
        source: $source
        destination: $destination
        type: $type
      )
    }
  `,
];

function usePetitionListActions({
  user,
  type,
  selectedCount,
  hasSelectedFolders,
  minimumPermission,
  onRenameClick,
  onShareClick,
  onCloneClick,
  onCloneAsTemplateClick,
  onUseTemplateClick,
  onDeleteClick,
  onMoveToClick,
}: {
  user: any;
  type: PetitionBaseType;
  selectedCount: number;
  hasSelectedFolders: boolean;
  minimumPermission: PetitionPermissionType;
  onRenameClick: () => void;
  onShareClick: () => void;
  onCloneClick: () => void;
  onCloneAsTemplateClick: () => void;
  onUseTemplateClick: () => void;
  onDeleteClick: () => void;
  onMoveToClick: () => void;
}) {
  return [
    {
      key: "rename",
      onClick: onRenameClick,
      isDisabled: selectedCount !== 1 || minimumPermission === "READ",
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
            isDisabled: hasSelectedFolders,
            onClick: onCloneClick,
            leftIcon: <CopyIcon />,
            children: (
              <FormattedMessage id="page.petitions-list.actions-clone" defaultMessage="Duplicate" />
            ),
          },
          {
            key: "move-to",
            onClick: onMoveToClick,
            isDisabled: minimumPermission === "READ",
            leftIcon: <FolderIcon />,
            children: (
              <FormattedMessage
                id="page.petitions-list.actions-move-to"
                defaultMessage="Move to..."
              />
            ),
          },
        ]),
    type === "PETITION"
      ? {
          key: "saveAsTemplate",
          onClick: onCloneAsTemplateClick,
          isDisabled: selectedCount !== 1 || hasSelectedFolders,
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
          isDisabled: selectedCount !== 1 || hasSelectedFolders,
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
