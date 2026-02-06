import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Center,
  Flex,
  MenuButton,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  Stack,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import {
  AddIcon,
  ArchiveIcon,
  ChevronDownIcon,
  CopyIcon,
  DeleteIcon,
  EditSimpleIcon,
  FolderIcon,
  PaperPlaneIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { RestrictedFeaturePopover } from "@parallel/components/common/RestrictedFeaturePopover";
import { SimpleMenuSelect } from "@parallel/components/common/SimpleMenuSelect";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
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
import { useNewTemplateDialog } from "@parallel/components/petition-new/dialogs/NewTemplateDialog";
import { Button, Text } from "@parallel/components/ui";
import {
  PetitionBaseType,
  PetitionPermissionType,
  Petitions_PetitionBaseOrFolderFragment,
  Petitions_UserFragment,
  Petitions_movePetitionsDocument,
  Petitions_petitionsDocument,
  Petitions_renameFolderDocument,
  Petitions_userDocument,
} from "@parallel/graphql/__types";
import { removeTypenames } from "@parallel/utils/apollo/removeTypenames";
import { isTypename } from "@parallel/utils/apollo/typename";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useUpdatePetitionName } from "@parallel/utils/hooks/useUpdatePetitionName";
import { useClonePetitions } from "@parallel/utils/mutations/useClonePetitions";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { useRecoverPetition } from "@parallel/utils/mutations/useRecoverPetition";
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  buildPetitionsQueryStateUrl,
  parsePetitionsQuery,
  usePetitionsQueryState,
} from "@parallel/utils/petitionsQueryState";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import {
  DEFAULT_PETITION_COLUMN_SELECTION,
  getPetitionsTableIncludes,
  getTemplatesTableIncludes,
  usePetitionsTableColumns,
} from "@parallel/utils/usePetitionsTableColumns";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { MotionConfig } from "framer-motion";
import { MouseEvent, PropsWithChildren, ReactNode, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { firstBy, isNonNullish, isNullish, map, omit, pick, pipe } from "remeda";

function rowKeyProp(row: Petitions_PetitionBaseOrFolderFragment) {
  return row.__typename === "PetitionFolder" ? row.folderId : (row as any).id;
}

interface PetitionsTableContext {
  user: Petitions_UserFragment;
  isScheduledForDeletion: boolean;
  setIsScheduledForDeletion: (isScheduledForDeletion: boolean) => void;
}

function Petitions() {
  const intl = useIntl();

  const [queryState, setQueryState] = usePetitionsQueryState();
  const [fromDashboardModule, setFromDashboardModule] = useState<string | null>(null);
  useTempQueryParam("fromDashboardModule", (value) => {
    if (value) {
      setFromDashboardModule(value);
    }
  });

  const stateRef = useUpdatingRef(queryState);
  const userHasBypassPermission = useHasPermission("PETITIONS:BYPASS_PERMISSIONS");

  const sort =
    queryState.sort ??
    (queryState.type === "PETITION"
      ? ({ field: "sentAt", direction: "DESC" } as const)
      : ({ field: "createdAt", direction: "DESC" } as const));
  const { data: queryObject } = useAssertQuery(Petitions_userDocument);
  const { me } = queryObject;

  const fallbackColumns = me.hasPetitionApprovalFlow
    ? DEFAULT_PETITION_COLUMN_SELECTION
    : DEFAULT_PETITION_COLUMN_SELECTION.filter((c) => c !== "approvals");
  const currentColumns = queryState.columns;

  const { data, loading, refetch } = useQueryOrPreviousData(
    Petitions_petitionsDocument,
    {
      variables: {
        offset: queryState.items * (queryState.page - 1),
        limit: queryState.items,
        search: queryState.search,
        isScheduledForDeletion: queryState.scheduledForDeletion ?? false,
        filters: {
          path: queryState.search && queryState.searchIn === "EVERYWHERE" ? null : queryState.path,
          status: queryState.status,
          signature: queryState.signature,
          type: queryState.type,
          tags: queryState.tagsFilters,
          sharedWith: queryState.sharedWith,
          fromTemplateId: queryState.fromTemplateId,
          approvals: queryState.approvals,
        },
        sortBy: [`${sort.field}_${sort.direction}`],
        ...(queryState.type === "PETITION"
          ? getPetitionsTableIncludes(currentColumns ?? fallbackColumns)
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
    petitions?.items as Petitions_PetitionBaseOrFolderFragment[] | undefined,
    rowKeyProp,
  );

  useEffectSkipFirst(() => {
    setFromDashboardModule(null);
  }, [queryState.view, queryState.type]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFromDashboardModule(null);
    setQueryState((current) => ({ ...current, [key]: value, page: 1 }));
  }, []);

  function handleTypeChange(type: PetitionBaseType) {
    if (type === "PETITION") {
      const defaultView = me.petitionListViews.find((v) => v.isDefault);
      if (isNonNullish(defaultView)) {
        setQueryState({
          type,
          view: defaultView.id,
          ...omit(defaultView.data, ["__typename", "scheduledForDeletion"]),
          scheduledForDeletion: defaultView.data.scheduledForDeletion ?? undefined,
        });
      } else {
        setQueryState({ type, scheduledForDeletion: queryState.scheduledForDeletion });
      }
    } else {
      setQueryState({ type, scheduledForDeletion: queryState.scheduledForDeletion });
    }
  }

  const showNewTemplateDialog = useNewTemplateDialog();
  const navigate = useHandleNavigation();
  const handleCreateNewParallelOrTemplate = async () => {
    try {
      if (queryState.type === "PETITION") {
        navigate(`/app/petitions/new`);
      } else {
        const templateId = await showNewTemplateDialog();
        if (!templateId) {
          const id = await createPetition({ type: "TEMPLATE", path: queryState.path });
          if (id) {
            goToPetition(id, "compose", { query: { new: "" } });
          }
        } else {
          const petitionIds = await clonePetitions({
            petitionIds: [templateId],
            keepTitle: true,
            path: queryState.path,
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
        isTemplate: queryState.type === "TEMPLATE",
        currentPath: queryState.path,
      });
      await movePetitions({
        variables: {
          ids: data.petitions.map((p) => p.id),
          source: queryState.path,
          destination: `${queryState.path}${data.name}/`,
          type: queryState.type,
        },
      });
      await refetch();
    } catch {}
  };

  const deletePetitions = useDeletePetitions();
  const handleDeleteClick = useCallback(async (deletePermanently: boolean) => {
    try {
      await deletePetitions(
        selectedRowsRef.current,
        stateRef.current.type,
        stateRef.current.path,
        undefined,
        deletePermanently,
      );
      refetch();
    } catch {}
  }, []);

  const recoverPetition = useRecoverPetition();
  const handleRecoverClick = useCallback(async () => {
    try {
      const needRefetch = await recoverPetition(selectedRowsRef.current, stateRef.current.type);
      if (needRefetch) {
        refetch();
      }
    } catch {}
  }, []);

  const goToPetition = useGoToPetition();

  const createPetition = useCreatePetition();

  const handleCloneAsTemplate = useCallback(async function () {
    try {
      const templateId = await createPetition({
        petitionId: selectedIdsRef.current[0],
        type: "TEMPLATE",
      });
      if (templateId) {
        goToPetition(templateId, "compose", { query: { new: "" } });
      }
    } catch {}
  }, []);

  const handleUseTemplateClick = useCallback(async function () {
    try {
      const petitionId = await createPetition({
        petitionId: selectedIdsRef.current[0],
      });
      if (petitionId) {
        goToPetition(petitionId, "preview", {
          query: { new: "", fromTemplate: "" },
        });
      }
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
        type: queryState.type,
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

  const updatePetitionName = useUpdatePetitionName();
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
          await updatePetitionName(petition.id, newName);
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

  const columns = usePetitionsTableColumns(queryState.type, me);

  const selection = queryState.type === "PETITION" ? (currentColumns ?? fallbackColumns) : [];

  const filteredColumns = useMemo(() => {
    if (queryState.type === "TEMPLATE") {
      return columns;
    } else {
      return ["name", ...selection]
        .map((key) => columns.find((c) => c.key === key))
        .filter(isNonNullish);
    }
  }, [selection.join(","), queryState.type]);

  const context = useMemo(
    () =>
      ({
        user: me!,
        isScheduledForDeletion: queryState.scheduledForDeletion,
        setIsScheduledForDeletion: (isScheduledForDeletion) => {
          onChangeSelectedIds([]);
          setQueryState((current) => ({
            ...current,
            scheduledForDeletion: isScheduledForDeletion,
          }));
        },
      }) as PetitionsTableContext,
    [me, queryState.scheduledForDeletion],
  );

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
      firstBy((p) => ["READ", "WRITE", "OWNER"].indexOf(p)),
    )!;
  }, [selectedRows]);

  const selectedPetitionIsAnonymized = selectedRows.some(
    (r) => r.__typename === "Petition" && r.isAnonymized,
  );

  const actions = usePetitionListActions({
    showDeleted: queryState.scheduledForDeletion,
    userCanChangePath,
    userCanCreateTemplate: userCanCreateTemplate && !selectedPetitionIsAnonymized,
    userCanCreatePetition,
    type: queryState.type,
    selectedCount: selectedRows.length,
    hasSelectedFolders: selectedRows.some((c) => c.__typename === "PetitionFolder"),
    minimumPermission,
    userHasBypassPermission,
    onRenameClick: handleRenameClick,
    onDeleteClick: () => handleDeleteClick(true),
    onCloneAsTemplateClick: handleCloneAsTemplate,
    onUseTemplateClick: handleUseTemplateClick,
    onCloneClick: handleCloneClick,
    onShareClick: handlePetitionSharingClick,
    onMoveToClick: handleMoveToClick,
    onScheduleForDeletionClick: () => handleDeleteClick(false),
    onRecoverClick: handleRecoverClick,
  });

  return (
    <AppLayout
      title={
        queryState.type === "PETITION"
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
      <Stack flex={1} minHeight={0} paddingX={4} paddingTop={6} spacing={4}>
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
                {queryState.type === "PETITION"
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
                  <MenuOptionGroup value={queryState.type}>
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
                disabled={!userCanChangePath}
              >
                <FormattedMessage id="page.petitions-list.new-folder" defaultMessage="New folder" />
              </Button>
            </RestrictedFeaturePopover>
            <RestrictedFeaturePopover
              isRestricted={!userCanCreateTemplate && queryState.type === "TEMPLATE"}
            >
              <Button
                display={{ base: "none", md: "block" }}
                colorPalette="primary"
                onClick={handleCreateNewParallelOrTemplate}
                disabled={!userCanCreateTemplate && queryState.type === "TEMPLATE"}
              >
                {queryState.type === "PETITION" ? (
                  <FormattedMessage id="generic.create-petition" defaultMessage="Create parallel" />
                ) : (
                  <FormattedMessage id="generic.create-template" defaultMessage="Create template" />
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
                    isDisabled={!userCanCreateTemplate && queryState.type === "TEMPLATE"}
                  >
                    {queryState.type === "PETITION" ? (
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
        {isNonNullish(fromDashboardModule) && (
          <CloseableAlert status="info" variant="subtle" borderRadius="md" padding={4}>
            <AlertIcon />
            <AlertDescription flex={1}>
              <FormattedMessage
                id="page.petitions.from-dashboard-description"
                defaultMessage="You are viewing a filter from the dashboard module: {module}. Results may differ due to the parallels not being shared with you."
                values={{ module: <b>{fromDashboardModule}</b> }}
              />
            </AlertDescription>
          </CloseableAlert>
        )}

        {queryState.scheduledForDeletion && (
          <Alert status="info" variant="subtle" borderRadius="md" padding={4}>
            <AlertIcon />
            <AlertDescription flex={1}>
              <FormattedMessage
                id="page.petitions.scheduled-for-deletion-alert"
                defaultMessage="All {type, select, PETITION {parallels} other {templates}} in the bin will be permanently deleted 90 days after being deleted."
                values={{ type: queryState.type }}
              />
            </AlertDescription>
          </Alert>
        )}

        <Flex direction="column" flex={1} minHeight={0} paddingBottom={16}>
          <TablePage
            flex="0 1 auto"
            columns={filteredColumns}
            rows={petitions?.items as Petitions_PetitionBaseOrFolderFragment[] | undefined}
            context={context}
            rowKeyProp={rowKeyProp}
            isSelectable
            isHighlightable
            loading={loading}
            onRowClick={handleRowClick}
            page={queryState.page}
            pageSize={queryState.items}
            totalCount={petitions?.totalCount}
            sort={sort}
            filter={pick(queryState, [
              "sharedWith",
              "status",
              "tagsFilters",
              "signature",
              "fromTemplateId",
              "approvals",
            ])}
            onFilterChange={handleFilterChange}
            onSelectionChange={onChangeSelectedIds}
            onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
            onPageSizeChange={(items) =>
              setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
            }
            onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
            actions={actions}
            header={
              <>
                {queryState.type === "PETITION" ? (
                  <MotionConfig reducedMotion="always">
                    <PetitionViewTabs views={me.petitionListViews} />
                  </MotionConfig>
                ) : null}
                <PetitionListHeader
                  columns={columns}
                  selection={selection}
                  onReload={() => refetch()}
                  views={me.petitionListViews}
                />
              </>
            }
            body={
              data?.petitions?.totalCount === 0 && !loading ? (
                queryState.search ||
                queryState.sharedWith ||
                queryState.tagsFilters ||
                queryState.status ||
                queryState.signature ||
                queryState.approvals ? (
                  <Center flex="1" minHeight="200px">
                    <Text color="gray.400" fontSize="lg">
                      <FormattedMessage
                        id="page.petitions.no-results"
                        defaultMessage="There are no parallels matching your criteria"
                      />
                    </Text>
                  </Center>
                ) : queryState.path !== "/" ? (
                  <EmptyFolderIllustration
                    flex="1"
                    minHeight="200px"
                    isTemplate={queryState.type === "TEMPLATE"}
                  />
                ) : (
                  <Center flex="1" minHeight="200px">
                    {queryState.scheduledForDeletion ? (
                      <Text fontSize="lg">
                        <FormattedMessage
                          id="page.petitions.no-deleted-templates-or-parallels"
                          defaultMessage="There are no {type, select, PETITION {parallels} other {templates}} in the bin"
                          values={{ type: queryState.type }}
                        />
                      </Text>
                    ) : (
                      <Text fontSize="lg">
                        <FormattedMessage
                          id="page.petitions.no-templates-or-parallels"
                          defaultMessage="You have no {type, select, PETITION {parallels} other {templates}} yet. Start by creating one now!"
                          values={{ type: queryState.type }}
                        />
                      </Text>
                    )}
                  </Center>
                )
              ) : null
            }
            Footer={CustomFooter}
          />
        </Flex>
      </Stack>
    </AppLayout>
  );
}

function CustomFooter({
  isScheduledForDeletion,
  setIsScheduledForDeletion,
  children,
}: PropsWithChildren<PetitionsTableContext>) {
  const options = useSimpleSelectOptions<"OPEN" | "DELETION_SCHEDULED">(
    (intl) => [
      {
        label: intl.formatMessage({ id: "generic.open", defaultMessage: "Open" }),
        value: "OPEN",
      },
      {
        label: intl.formatMessage({
          id: "generic.bin",
          defaultMessage: "Bin",
        }),
        value: "DELETION_SCHEDULED",
      },
    ],

    [],
  );
  return (
    <>
      <SimpleMenuSelect
        options={options}
        value={isScheduledForDeletion ? "DELETION_SCHEDULED" : "OPEN"}
        onChange={(value) => setIsScheduledForDeletion(value === "DELETION_SCHEDULED")}
        size="sm"
        variant="ghost"
      />

      {children}
    </>
  );
}

const _fragments = {
  User: gql`
    fragment Petitions_User on User {
      id
      ...usePetitionsTableColumns_User
      hasPetitionApprovalFlow: hasFeatureFlag(featureFlag: PETITION_APPROVAL_FLOW)
      petitionListViews {
        ...PetitionViewTabs_PetitionListView
        ...PetitionListHeader_PetitionListView
      }
    }
  `,
  PetitionBaseOrFolder: gql`
    fragment Petitions_PetitionBaseOrFolder on PetitionBaseOrFolder {
      ...useDeletePetitions_PetitionBaseOrFolder
      ...useRecoverPetition_PetitionBaseOrFolder
      ... on PetitionBase {
        name
        ...usePetitionsTableColumns_PetitionBase
        myEffectivePermission {
          permissionType
        }
      }
      ... on Petition {
        status
        isAnonymized
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
  `,
};

const _queries = [
  gql`
    query Petitions_user {
      ...AppLayout_Query
      me {
        ...Petitions_User
      }
    }
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
      $includeApprovals: Boolean!
      $isScheduledForDeletion: Boolean!
    ) {
      petitions(
        offset: $offset
        limit: $limit
        search: $search
        sortBy: $sortBy
        filters: $filters
        isScheduledForDeletion: $isScheduledForDeletion
      ) {
        items {
          ...Petitions_PetitionBaseOrFolder
        }
        totalCount
      }
    }
  `,
];

const _mutations = [
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
  showDeleted,
  userCanChangePath,
  userCanCreateTemplate,
  userCanCreatePetition,
  type,
  selectedCount,
  hasSelectedFolders,
  minimumPermission,
  userHasBypassPermission,
  onRenameClick,
  onShareClick,
  onCloneClick,
  onCloneAsTemplateClick,
  onUseTemplateClick,
  onDeleteClick,
  onMoveToClick,
  onRecoverClick,
  onScheduleForDeletionClick,
}: {
  showDeleted: boolean;
  userCanChangePath: boolean;
  userCanCreateTemplate: boolean;
  userCanCreatePetition: boolean;
  type: PetitionBaseType;
  selectedCount: number;
  hasSelectedFolders: boolean;
  minimumPermission: PetitionPermissionType;
  userHasBypassPermission: boolean;
  onRenameClick: () => void;
  onShareClick: () => void;
  onCloneClick: () => void;
  onCloneAsTemplateClick: () => void;
  onUseTemplateClick: () => void;
  onDeleteClick: () => void;
  onMoveToClick: () => void;
  onRecoverClick: () => void;
  onScheduleForDeletionClick: () => void;
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

  if (showDeleted) {
    return [
      {
        key: "recover",
        onClick: onRecoverClick,
        leftIcon: <ArchiveIcon />,
        isDisabled: !userHasBypassPermission && minimumPermission !== "OWNER",
        children: <FormattedMessage id="generic.recover" defaultMessage="Recover" />,
      },
      {
        key: "delete",
        onClick: onDeleteClick,
        leftIcon: <DeleteIcon />,
        children: (
          <FormattedMessage id="generic.delete-permanently" defaultMessage="Delete permanently" />
        ),

        colorScheme: "red",
      },
    ];
  }

  return [
    {
      key: "rename",
      onClick: onRenameClick,
      isDisabled: selectedCount !== 1 || minimumPermission === "READ",
      leftIcon: <EditSimpleIcon />,
      children: <FormattedMessage id="generic.rename" defaultMessage="Rename" />,
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
      key: "scheduleForDeletion",
      onClick: onScheduleForDeletionClick,
      leftIcon: <DeleteIcon />,
      children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
      colorScheme: "red",
    },
  ];
}

Petitions.getInitialProps = async ({ fetchQuery, query }: WithApolloDataContext) => {
  const state = parsePetitionsQuery(query);
  const { data } = await fetchQuery(Petitions_userDocument);
  const views = data.me.petitionListViews;

  if (state.type === "PETITION") {
    if (
      isNullish(state.view) ||
      (state.view !== "ALL" && !views.some((v) => v.id === state.view))
    ) {
      const allView = views.find((v) => v.type === "ALL")!;
      const view =
        (isNullish(state.view)
          ? views.find((v) => v.isDefault)
          : views.find((v) => v.id === state.view)) ?? allView;
      throw new RedirectError(
        buildPetitionsQueryStateUrl(
          {
            type: state.type,
            view: view.type === "ALL" ? "ALL" : view.id,
            search: state.search ?? view.data.search,
            searchIn: state.searchIn ?? view.data.searchIn,
            sort: state.sort ?? removeTypenames(view.data.sort) ?? undefined,
            path: state.path ?? view.data.path,
            status: state.status ?? view.data.status ?? undefined,
            sharedWith: state.sharedWith ?? removeTypenames(view.data.sharedWith) ?? undefined,
            approvals: state.approvals ?? removeTypenames(view.data.approvals) ?? undefined,
            tagsFilters: state.tagsFilters ?? removeTypenames(view.data.tagsFilters) ?? undefined,
            fromTemplateId: state.fromTemplateId ?? view.data.fromTemplateId ?? undefined,
            signature: state.signature ?? view.data.signature ?? undefined,
            columns: state.columns ?? view.data.columns ?? undefined,
          },
          query,
        ),
      );
    }
  }
};

export default compose(withDialogs, withApolloData)(Petitions);
