import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  MenuButton,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import {
  AddIcon,
  ChevronDownIcon,
  CopyIcon,
  DeleteIcon,
  EditSimpleIcon,
  FolderIcon,
  PaperPlaneIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { RestrictedFeaturePopover } from "@parallel/components/common/RestrictedFeaturePopover";
import { SearchInOptions } from "@parallel/components/common/SearchAllOrCurrentFolder";
import { Spacer } from "@parallel/components/common/Spacer";
import { TablePage } from "@parallel/components/common/TablePage";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionViewTabs } from "@parallel/components/common/view-tabs/PetitionViewTabs";
import {
  RedirectError,
  WithApolloDataContext,
  withApolloData,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { EmptyFolderIllustration } from "@parallel/components/petition-common/EmptyFolderIllustration";
import { useCreateFolderDialog } from "@parallel/components/petition-common/dialogs/CreateFolderDialog";
import { useMoveToFolderDialog } from "@parallel/components/petition-common/dialogs/MoveToFolderDialog";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import { useRenameDialog } from "@parallel/components/petition-common/dialogs/RenameDialog";
import { PetitionListHeader } from "@parallel/components/petition-list/PetitionListHeader";
import {
  removeInvalidSharedWithFilterLines,
  sharedWithQueryItem,
} from "@parallel/components/petition-list/filters/shared-with/PetitionListSharedWithFilter";
import {
  removeInvalidTagFilterLines,
  tagFilterQueryItem,
} from "@parallel/components/petition-list/filters/tags/PetitionListTagFilter";
import { useNewTemplateDialog } from "@parallel/components/petition-new/dialogs/NewTemplateDialog";
import {
  PetitionBaseType,
  PetitionPermissionType,
  PetitionSignatureStatusFilter,
  PetitionStatus,
  PetitionTagFilter,
  Petitions_PetitionBaseOrFolderFragment,
  Petitions_movePetitionsDocument,
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
  QueryItem,
  QueryStateFrom,
  buildStateUrl,
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import {
  DEFAULT_PETITION_COLUMN_SELECTION,
  PETITIONS_COLUMNS,
  PetitionsTableColumn,
  getPetitionsTableIncludes,
  getTemplatesTableIncludes,
  usePetitionsTableColumns,
} from "@parallel/utils/usePetitionsTableColumns";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { MouseEvent, ReactNode, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, map, maxBy, omit, pick, pipe } from "remeda";

const SORTING = [
  "name",
  "createdAt",
  "sentAt",
  "lastActivityAt",
  "lastRecipientActivityAt",
] as const;

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
  sort: sorting(SORTING),
  sharedWith: sharedWithQueryItem(),
  tagsFilters: tagFilterQueryItem(),
  fromTemplateId: string().list(),
  signature: values<PetitionSignatureStatusFilter>([
    "NO_SIGNATURE",
    "NOT_STARTED",
    "PENDING_START",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
  ]).list(),
  columns: values(
    PETITIONS_COLUMNS.filter((c) => !c.isFixed).map((c) => c.key as PetitionsTableColumn),
  ).list({ allowEmpty: true }),
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
  const { data: queryObject } = useAssertQuery(Petitions_userDocument);
  const { me } = queryObject;
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
          tags: removeInvalidTagFilterLines(state.tagsFilters),
          sharedWith: removeInvalidSharedWithFilterLines(state.sharedWith),
          fromTemplateId: state.fromTemplateId,
        },
        sortBy: [`${sort.field}_${sort.direction}`],
        ...(state.type === "PETITION"
          ? getPetitionsTableIncludes(state.columns ?? DEFAULT_PETITION_COLUMN_SELECTION)
          : getTemplatesTableIncludes()),
      },
      fetchPolicy: "cache-and-network",
    },
    (prev, curr) => prev?.variables?.filters?.type === curr?.variables?.filters?.type,
  );

  const petitions = data?.petitions;

  const userCanChangePath = useHasPermission("PETITIONS:CHANGE_PATH");
  const userCanCreateTemplate = useHasPermission("PETITIONS:CREATE_TEMPLATES");
  const userCanCreatePetition = useHasPermission("PETITIONS:CREATE_PETITIONS");

  const { selectedIdsRef, selectedRows, selectedRowsRef, onChangeSelectedIds } = useSelection(
    petitions?.items,
    rowKeyProp,
  );

  function handleTypeChange(type: PetitionBaseType) {
    if (type === "PETITION") {
      const defaultView = me.petitionListViews.find((v) => v.isDefault);
      if (isNonNullish(defaultView)) {
        setQueryState({
          type,
          view: defaultView.id,
          ...omit(defaultView.data, ["__typename"]),
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
          .filter(isTypename(["Petition", "PetitionTemplate"]))
          .map((p) => p.id),
        folderIds: selectedRowsRef.current
          .filter(isTypename("PetitionFolder"))
          .map((p) => p.folderId),
        type: state.type,
        currentPath: stateRef.current.path,
      });
    } catch {}
    await refetch();
  };
  const handleRowClick = useCallback(function (
    row: Petitions_PetitionBaseOrFolderFragment,
    event: MouseEvent,
  ) {
    if (row.__typename === "PetitionFolder") {
      setQueryState(
        (current) => ({
          ...current,
          path: row.path,
          page: 1,
        }),
        { type: "push", event },
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
        { event },
      );
    }
  }, []);

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
            .filter(isTypename(["Petition", "PetitionTemplate"]))
            .map(rowKeyProp),
          folderIds: selectedRowsRef.current.filter(isTypename("PetitionFolder")).map(rowKeyProp),
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

  const columns = usePetitionsTableColumns(
    state.type,
    state.type === "PETITION" ? (state.columns ?? DEFAULT_PETITION_COLUMN_SELECTION) : undefined,
  );

  const context = useMemo(() => ({ user: me! }), [me]);

  const minimumPermission = useMemo(() => {
    return pipe(
      selectedRows,
      map((r) =>
        r.__typename === "PetitionFolder"
          ? r.minimumPermissionType
          : r.__typename === "Petition" || r.__typename === "PetitionTemplate"
            ? r.myEffectivePermission!.permissionType
            : (null as never),
      ),
      maxBy((p) => ["OWNER", "WRITE", "READ"].indexOf(p)),
    )!;
  }, [selectedRows]);

  const actions = usePetitionListActions({
    userCanChangePath,
    userCanCreateTemplate,
    userCanCreatePetition,
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
              id: "generic.root-petitions",
              defaultMessage: "Parallels",
            })
          : intl.formatMessage({
              id: "generic.root-templates",
              defaultMessage: "Templates",
            })
      }
      queryObject={queryObject}
    >
      <Stack minHeight={0} paddingX={4} paddingTop={6} spacing={4}>
        <Flex alignItems="center">
          <Box minWidth="0" width="fit-content">
            <Menu matchWidth>
              <MenuButton
                as={Button}
                size="lg"
                variant="outline"
                fontSize="2xl"
                paddingX={4}
                backgroundColor="white"
                data-action="change-parallel-template"
                data-testid="petition-type-menu-button"
                leftIcon={<PaperPlaneIcon boxSize={6} />}
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
                    <MenuItemOption
                      value="PETITION"
                      onClick={() => handleTypeChange("PETITION")}
                      data-testid="petition-type-petition"
                    >
                      <FormattedMessage
                        id="generic.parallel-type-plural"
                        defaultMessage="Parallels"
                      />
                    </MenuItemOption>
                    <MenuItemOption
                      value="TEMPLATE"
                      onClick={() => handleTypeChange("TEMPLATE")}
                      data-testid="petition-type-template"
                    >
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
            <RestrictedFeaturePopover isRestricted={!userCanChangePath}>
              <Button
                display={{ base: "none", md: "block" }}
                onClick={handleCreateFolder}
                isDisabled={!userCanChangePath}
              >
                <FormattedMessage id="page.petitions-list.new-folder" defaultMessage="New folder" />
              </Button>
            </RestrictedFeaturePopover>
            <RestrictedFeaturePopover
              isRestricted={!userCanCreateTemplate && state.type === "TEMPLATE"}
            >
              <Button
                display={{ base: "none", md: "block" }}
                colorScheme="primary"
                onClick={handleCreateNewParallelOrTemplate}
                isDisabled={!userCanCreateTemplate && state.type === "TEMPLATE"}
              >
                {state.type === "PETITION" ? (
                  <FormattedMessage id="generic.create-petition" defaultMessage="Create parallel" />
                ) : (
                  <FormattedMessage
                    id="page.petitions-list.create-template"
                    defaultMessage="Create template"
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
                  <MenuItem onClick={handleCreateFolder} isDisabled={!userCanChangePath}>
                    <FormattedMessage
                      id="page.petitions-list.new-folder"
                      defaultMessage="New folder"
                    />
                  </MenuItem>
                  <MenuItem
                    onClick={handleCreateNewParallelOrTemplate}
                    isDisabled={!userCanCreateTemplate && state.type === "TEMPLATE"}
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
        <Box flex="1" paddingBottom={16}>
          <TablePage
            flex="0 1 auto"
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
            filter={pick(state, [
              "sharedWith",
              "status",
              "tagsFilters",
              "signature",
              "fromTemplateId",
            ])}
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
                  <PetitionViewTabs
                    state={state}
                    onStateChange={setQueryState}
                    views={me.petitionListViews}
                  />
                ) : null}
                <PetitionListHeader
                  shape={QUERY_STATE}
                  state={state}
                  onStateChange={setQueryState}
                  onReload={() => refetch()}
                  views={me.petitionListViews}
                />
              </>
            }
            body={
              data?.petitions.totalCount === 0 && !loading ? (
                state.search ||
                state.sharedWith ||
                state.tagsFilters ||
                state.status ||
                state.signature ? (
                  <Center flex="1">
                    <Text color="gray.400" fontSize="lg">
                      <FormattedMessage
                        id="page.petitions.no-results"
                        defaultMessage="There's no parallels matching your criteria"
                      />
                    </Text>
                  </Center>
                ) : state.path !== "/" ? (
                  <EmptyFolderIllustration flex="1" isTemplate={state.type === "TEMPLATE"} />
                ) : (
                  <Center flex="1">
                    <Text fontSize="lg">
                      {state.type === "TEMPLATE" ? (
                        <FormattedMessage
                          id="page.petitions.no-templates"
                          defaultMessage="You have no templates yet. Start by creating one now!"
                        />
                      ) : (
                        <FormattedMessage
                          id="page.petitions.no-parallels"
                          defaultMessage="You have no parallels yet. Start by creating one now!"
                        />
                      )}
                    </Text>
                  </Center>
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
        petitionListViews {
          ...PetitionViewTabs_PetitionListView
          ...PetitionListHeader_PetitionListView
        }
      }
      ${PetitionListHeader.fragments.PetitionListView}
      ${PetitionViewTabs.fragments.PetitionListView}
    `;
  },
  get PetitionBaseOrFolder() {
    return gql`
      fragment Petitions_PetitionBaseOrFolder on PetitionBaseOrFolder {
        ...useDeletePetitions_PetitionBaseOrFolder
        ... on PetitionBase {
          name
          ...usePetitionsTableColumns_PetitionBase
          myEffectivePermission {
            permissionType
          }
        }
        ... on Petition {
          status
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
      $includeRecipients: Boolean!
      $includeTemplate: Boolean!
      $includeStatus: Boolean!
      $includeSignature: Boolean!
      $includeSharedWith: Boolean!
      $includeSentAt: Boolean!
      $includeCreatedAt: Boolean!
      $includeReminders: Boolean!
      $includeTags: Boolean!
      $includeLastActivityAt: Boolean!
      $includeLastRecipientActivityAt: Boolean!
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
  userCanChangePath,
  userCanCreateTemplate,
  userCanCreatePetition,
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
  userCanChangePath: boolean;
  userCanCreateTemplate: boolean;
  userCanCreatePetition: boolean;
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
  const restrictWhenCantChangePath = (button: ReactNode) => (
    <RestrictedFeaturePopover isRestricted={!userCanChangePath}>{button}</RestrictedFeaturePopover>
  );
  const restrictWhenCantCreateTemplate = (button: ReactNode) => (
    <RestrictedFeaturePopover isRestricted={!userCanCreateTemplate}>
      {button}
    </RestrictedFeaturePopover>
  );
  const restrictWhenCantCreatePetition = (button: ReactNode) => (
    <RestrictedFeaturePopover isRestricted={!userCanCreatePetition}>
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
    ...(type === "TEMPLATE"
      ? [
          {
            key: "clone",
            isDisabled: hasSelectedFolders || !userCanCreateTemplate,
            onClick: onCloneClick,
            leftIcon: <CopyIcon />,
            children: <FormattedMessage id="generic.duplicate" defaultMessage="Duplicate" />,
            wrap: restrictWhenCantCreateTemplate,
          },
        ]
      : []),
    {
      key: "move-to",
      onClick: onMoveToClick,
      isDisabled: minimumPermission === "READ" || !userCanChangePath,
      leftIcon: <FolderIcon />,
      children: <FormattedMessage id="generic.move-to" defaultMessage="Move to..." />,
      wrap: restrictWhenCantChangePath,
    },

    type === "PETITION"
      ? {
          key: "saveAsTemplate",
          onClick: onCloneAsTemplateClick,
          isDisabled: selectedCount !== 1 || hasSelectedFolders || !userCanCreateTemplate,
          leftIcon: <CopyIcon />,
          children: (
            <FormattedMessage
              id="page.petitions-list.actions-save-as-template"
              defaultMessage="Save as template"
            />
          ),
          wrap: restrictWhenCantCreateTemplate,
        }
      : {
          key: "useTemplate",
          onClick: onUseTemplateClick,
          isDisabled: selectedCount !== 1 || hasSelectedFolders || !userCanCreatePetition,
          leftIcon: <PaperPlaneIcon />,
          children: (
            <FormattedMessage id="generic.create-petition" defaultMessage="Create parallel" />
          ),
          wrap: restrictWhenCantCreatePetition,
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
    let tags: PetitionTagFilter | undefined = undefined;
    if (isNonNullish(query.tags)) {
      const tagsState = parseQuery(query, {
        tags: new QueryItem<string[] | null>((value) =>
          typeof value === "string" ? (value === "NO_TAGS" ? [] : value.split(",")) : null,
        ),
      });
      if (Array.isArray(tagsState.tags)) {
        tags = (
          tagsState.tags.length === 0
            ? {
                filters: [
                  {
                    value: [],
                    operator: "IS_EMPTY",
                  },
                ],
                operator: "AND",
              }
            : {
                filters: [
                  {
                    value: tagsState.tags,
                    operator: "CONTAINS",
                  },
                ],
                operator: "AND",
              }
        ) as PetitionTagFilter;
      }
    }

    const tagsFiltersOrNothing = tags ? { tagsFilters: tags } : {};

    if (isNullish(state.view)) {
      const defaultView = views.find((v) => v.isDefault);
      if (isNonNullish(defaultView)) {
        throw new RedirectError(
          buildStateUrl(
            QUERY_STATE,
            {
              view: defaultView.type === "ALL" ? "ALL" : defaultView.id,
              ...omit(defaultView.data, ["__typename"]),
              ...tagsFiltersOrNothing,
            },
            pathname,
            omit(query, ["tags"]),
          ),
        );
      } else {
        const allView = views.find((v) => v.type === "ALL");
        throw new RedirectError(
          buildStateUrl(
            QUERY_STATE,
            {
              view: "ALL",
              ...(allView ? omit(allView.data, ["__typename"]) : {}),
              ...tagsFiltersOrNothing,
            },
            pathname,
            omit(query, ["tags"]),
          ),
        );
      }
    } else if (state.view !== "ALL") {
      const view = views.find((v) => v.id === state.view);
      if (isNullish(view)) {
        throw new RedirectError(
          buildStateUrl(
            QUERY_STATE,
            { ...state, view: "ALL", ...tagsFiltersOrNothing },
            pathname,
            omit(query, ["tags"]),
          ),
        );
      }
    }
    if (tags) {
      throw new RedirectError(
        buildStateUrl(
          QUERY_STATE,
          { ...state, tagsFilters: tags },
          pathname,
          omit(query, ["tags"]),
        ),
      );
    }
  }
};

export default compose(withDialogs, withApolloData)(Petitions);
