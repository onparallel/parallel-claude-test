import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  AddIcon,
  ChevronDownIcon,
  CopyIcon,
  DeleteIcon,
  DocumentIcon,
  EditSimpleIcon,
  FolderIcon,
  PaperPlaneIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { RestrictedFeaturePopover } from "@parallel/components/common/RestrictedFeaturePopover";
import { SearchInOptions } from "@parallel/components/common/SearchAllOrCurrentFolder";
import { Spacer } from "@parallel/components/common/Spacer";
import { TableSortingDirection } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useCreateFolderDialog } from "@parallel/components/petition-common/dialogs/CreateFolderDialog";
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
import { ViewTabs } from "@parallel/components/petition-list/ViewTabs";
import { useNewTemplateDialog } from "@parallel/components/petition-new/dialogs/NewTemplateDialog";
import {
  PetitionBaseType,
  PetitionPermissionType,
  PetitionSharedWithFilter,
  PetitionSignatureStatusFilter,
  PetitionStatus,
  Petitions_movePetitionsDocument,
  Petitions_PetitionBaseOrFolderFragment,
  Petitions_petitionsDocument,
  Petitions_renameFolderDocument,
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
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  buildStateUrl,
  integer,
  object,
  parseQuery,
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
import { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, map, maxBy, pick, pipe } from "remeda";

const SORTING = ["name", "createdAt", "sentAt"] as const;

const QUERY_STATE = {
  view: string(),
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
  fromTemplateId: string().list(),
  signature: values<PetitionSignatureStatusFilter>([
    "NO_SIGNATURE",
    "NOT_STARTED",
    "PENDING_START",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
  ]).list(),
};

export type PetitionsQueryState = QueryStateFrom<typeof QUERY_STATE>;

function rowKeyProp(row: Petitions_PetitionBaseOrFolderFragment) {
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
          signature: state.signature,
          type: state.type,
          tagIds: state.tags,
          sharedWith: removeInvalidLines(state.sharedWith),
          fromTemplateId: state.fromTemplateId,
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
    if (type === "PETITION") {
      const defaultView = views.find((v) => v.isDefault);
      if (isDefined(defaultView)) {
        setQueryState({
          type,
          view: defaultView.id,
          ...(pick(defaultView.filters, [
            "status",
            "tags",
            "sharedWith",
            "signature",
            "fromTemplateId",
            "search",
            "searchIn",
            "path",
          ]) as Partial<PetitionsQueryState>),
        });
      } else {
        setQueryState({ type });
      }
    } else {
      setQueryState({ type });
    }
  }

  const showNewTemplateDialog = useNewTemplateDialog();
  const navigate = useHandleNavigation();
  const handleCreateNewParallelOrTemplate = async () => {
    try {
      if (state.type === "PETITION") {
        navigate(`/app/petitions/new`);
      } else {
        const templateId = await showNewTemplateDialog();
        if (!templateId) {
          const id = await createPetition({ type: "TEMPLATE", path: state.path });
          goToPetition(id, "compose", { query: { new: "" } });
        } else {
          const petitionIds = await clonePetitions({
            petitionIds: [templateId],
            keepTitle: true,
            path: state.path,
          });
          goToPetition(petitionIds[0], "compose", { query: { new: "" } });
        }
      }
    } catch {}
  };

  const showCreateFolderDialog = useCreateFolderDialog();
  const [movePetitions] = useMutation(Petitions_movePetitionsDocument);
  const handleCreateFolder = async () => {
    try {
      const data = await showCreateFolderDialog({
        isTemplate: state.type === "TEMPLATE",
        currentPath: state.path,
      });
      await movePetitions({
        variables: {
          ids: data.petitions.map((p) => p.id),
          source: state.path,
          destination: `${state.path}${data.name}/`,
          type: state.type,
        },
      });
      await refetch();
    } catch {}
  };

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
      goToPetition(templateId, "compose", { query: { new: "" } });
    } catch {}
  }, []);

  const handleUseTemplateClick = useCallback(async function () {
    try {
      const petitionId = await createPetition({
        petitionId: selectedIdsRef.current[0],
      });
      goToPetition(petitionId, "preview", {
        query: { new: "", fromTemplate: "" },
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
        goToPetition(petitionIds[0], "compose", { query: { new: "" } });
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
  const handleRowClick = useCallback(function (
    row: Petitions_PetitionBaseOrFolderFragment,
    event: MouseEvent
  ) {
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
  },
  []);

  const [updatePetition] = useMutation(Petitions_updatePetitionDocument);
  const [renameFolder] = useMutation(Petitions_renameFolderDocument);
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

        await renameFolder({
          variables: { folderId: row.folderId, name: newName, type: stateRef.current.type },
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

  const [views, setViews] = useState(me.petitionListViews);

  useEffect(() => {
    setViews(me.petitionListViews);
  }, [me]);

  const handleReorder = (viewIds: string[]) => {
    setViews((views) => viewIds.map((id) => views.find((v) => v.id === id)!));
  };

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
      <Stack minHeight={0} paddingX={4} paddingTop={6} paddingBottom={16} spacing={4}>
        <Flex alignItems="center">
          <Box minWidth="0" width="fit-content">
            <Menu matchWidth>
              <MenuButton
                as={Button}
                size="lg"
                variant="ghost"
                fontSize="2xl"
                paddingX={3}
                data-action="change-parallel-template"
                leftIcon={
                  state.type === "PETITION" ? (
                    <PaperPlaneIcon boxSize={6} />
                  ) : (
                    <DocumentIcon boxSize={6} />
                  )
                }
                rightIcon={<ChevronDownIcon boxSize={5} />}
              >
                {state.type === "PETITION"
                  ? intl.formatMessage({
                      id: "generic.parallel-type-plural",
                      defaultMessage: "Parallels",
                    })
                  : intl.formatMessage({
                      id: "generic.template-type-plural",
                      defaultMessage: "Templates",
                    })}
              </MenuButton>
              <Portal>
                <MenuList minWidth="154px">
                  <MenuOptionGroup value={state.type}>
                    <MenuItemOption value="PETITION" onClick={() => handleTypeChange("PETITION")}>
                      <FormattedMessage
                        id="generic.parallel-type-plural"
                        defaultMessage="Parallels"
                      />
                    </MenuItemOption>
                    <MenuItemOption value="TEMPLATE" onClick={() => handleTypeChange("TEMPLATE")}>
                      <FormattedMessage
                        id="generic.template-type-plural"
                        defaultMessage="Templates"
                      />
                    </MenuItemOption>
                  </MenuOptionGroup>
                </MenuList>
              </Portal>
            </Menu>
          </Box>
          <Spacer />
          <Flex gap={2}>
            <RestrictedFeaturePopover isRestricted={me.role === "COLLABORATOR"}>
              <Button
                display={{ base: "none", md: "block" }}
                onClick={handleCreateFolder}
                isDisabled={me.role === "COLLABORATOR"}
              >
                <FormattedMessage
                  id="page.petitions-list.create-folder"
                  defaultMessage="Create folder"
                />
              </Button>
            </RestrictedFeaturePopover>
            <RestrictedFeaturePopover
              isRestricted={me.role === "COLLABORATOR" && state.type === "TEMPLATE"}
            >
              <Button
                display={{ base: "none", md: "block" }}
                colorScheme="primary"
                onClick={handleCreateNewParallelOrTemplate}
                isDisabled={me.role === "COLLABORATOR" && state.type === "TEMPLATE"}
              >
                {state.type === "PETITION" ? (
                  <FormattedMessage id="generic.new-petition" defaultMessage="New parallel" />
                ) : (
                  <FormattedMessage
                    id="page.petitions-list.new-template"
                    defaultMessage="New template"
                  />
                )}
              </Button>
            </RestrictedFeaturePopover>
            <Menu>
              <MenuButton
                as={IconButtonWithTooltip}
                display={{ base: "flex", md: "none" }}
                colorScheme="primary"
                icon={<AddIcon />}
                label={intl.formatMessage({
                  id: "page.petitions-list.create-button",
                  defaultMessage: "New",
                })}
              />
              <Portal>
                <MenuList minWidth="fit-content">
                  <MenuItem onClick={handleCreateFolder} isDisabled={me.role === "COLLABORATOR"}>
                    <FormattedMessage
                      id="page.petitions-list.create-folder"
                      defaultMessage="Create folder"
                    />
                  </MenuItem>
                  <MenuItem
                    onClick={handleCreateNewParallelOrTemplate}
                    isDisabled={me.role === "COLLABORATOR" && state.type === "TEMPLATE"}
                  >
                    {state.type === "PETITION" ? (
                      <FormattedMessage id="generic.new-petition" defaultMessage="New parallel" />
                    ) : (
                      <FormattedMessage
                        id="page.petitions-list.new-template"
                        defaultMessage="New template"
                      />
                    )}
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </Flex>
        </Flex>
        <Box flex="1">
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
            filter={pick(state, ["sharedWith", "status", "tags", "signature"])}
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
              <>
                {state.type === "PETITION" ? (
                  <ViewTabs
                    state={state}
                    onStateChange={setQueryState}
                    views={views}
                    onReorder={handleReorder}
                  />
                ) : null}
                <PetitionListHeader
                  shape={QUERY_STATE}
                  state={state}
                  onStateChange={setQueryState}
                  onReload={() => refetch()}
                  views={views}
                />
              </>
            }
            body={
              data?.petitions.totalCount === 0 && !loading ? (
                state.search ||
                state.sharedWith ||
                state.tags ||
                state.status ||
                state.signature ? (
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
          />
        </Box>
      </Stack>
    </AppLayout>
  );
}

Petitions.fragments = {
  get User() {
    return gql`
      fragment Petitions_User on User {
        id
        role
        ...ViewTabs_User
      }
      ${ViewTabs.fragments.User}
    `;
  },
  get PetitionBaseOrFolder() {
    return gql`
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
    `;
  },
};

const _queries = [
  gql`
    query Petitions_user {
      ...AppLayout_Query
      me {
        ...Petitions_User
      }
    }
    ${AppLayout.fragments.Query}
    ${Petitions.fragments.User}
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
  gql`
    mutation Petitions_renameFolder($folderId: ID!, $name: String!, $type: PetitionBaseType!) {
      renameFolder(folderId: $folderId, name: $name, type: $type)
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
  const restrictToCollaborators = (button: ReactNode) => (
    <RestrictedFeaturePopover isRestricted={user.role === "COLLABORATOR"}>
      {button}
    </RestrictedFeaturePopover>
  );
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

    {
      key: "clone",
      isDisabled: hasSelectedFolders || user.role === "COLLABORATOR",
      onClick: onCloneClick,
      leftIcon: <CopyIcon />,
      children: (
        <FormattedMessage id="page.petitions-list.actions-clone" defaultMessage="Duplicate" />
      ),
      wrap: restrictToCollaborators,
    },
    {
      key: "move-to",
      onClick: onMoveToClick,
      isDisabled: minimumPermission === "READ" || user.role === "COLLABORATOR",
      leftIcon: <FolderIcon />,
      children: <FormattedMessage id="generic.move-to" defaultMessage="Move to..." />,
      wrap: restrictToCollaborators,
    },

    type === "PETITION"
      ? {
          key: "saveAsTemplate",
          onClick: onCloneAsTemplateClick,
          isDisabled: selectedCount !== 1 || hasSelectedFolders || user.role === "COLLABORATOR",
          leftIcon: <CopyIcon />,
          children: (
            <FormattedMessage
              id="page.petitions-list.actions-save-as-template"
              defaultMessage="Save as template"
            />
          ),
          wrap: restrictToCollaborators,
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

Petitions.getInitialProps = async ({ fetchQuery, query, pathname }: WithApolloDataContext) => {
  const state = parseQuery(query, QUERY_STATE);
  const { data } = await fetchQuery(Petitions_userDocument);
  const views = data.me.petitionListViews;

  if (state.type === "PETITION") {
    if (!isDefined(state.view)) {
      const defaultView = views.find((v) => v.isDefault);
      if (isDefined(defaultView)) {
        const sortBy = defaultView.sortBy ? defaultView.sortBy.split("_") : null;

        const { status, tags, sharedWith, signature, fromTemplateId, search, searchIn, path } =
          defaultView.filters;

        throw new RedirectError(
          buildStateUrl(
            QUERY_STATE,
            {
              view: defaultView.id,
              status,
              tags,
              sharedWith,
              signature,
              fromTemplateId: fromTemplateId ? [fromTemplateId] : undefined,
              search,
              searchIn: (searchIn as SearchInOptions) ?? undefined,
              path: path ?? undefined,
              sort: sortBy
                ? {
                    field: sortBy[0] as any,
                    direction: sortBy[1] as TableSortingDirection,
                  }
                : undefined,
            },
            pathname,
            query
          )
        );
      } else {
        throw new RedirectError(buildStateUrl(QUERY_STATE, { view: "ALL" }, pathname, query));
      }
    } else if (state.view !== "ALL") {
      const view = views.find((v) => v.id === state.view);
      if (!isDefined(view)) {
        throw new RedirectError(
          buildStateUrl(QUERY_STATE, { ...state, view: "ALL" }, pathname, query)
        );
      }
    }
  }
};

export default compose(withDialogs, withApolloData)(Petitions);
