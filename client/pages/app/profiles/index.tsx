import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  Icon,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  ArchiveIcon,
  BellIcon,
  ColumnsIcon,
  DeleteIcon,
  PinIcon,
  RepeatIcon,
} from "@parallel/chakra/icons";
import { ButtonWithMoreOptions } from "@parallel/components/common/ButtonWithMoreOptions";
import { HiddenFiltersButton } from "@parallel/components/common/HiddenFiltersButton";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { ProfileTypeReference } from "@parallel/components/common/ProfileTypeReference";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { SimpleMenuSelect } from "@parallel/components/common/SimpleMenuSelect";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { useColumnVisibilityDialog } from "@parallel/components/common/dialogs/ColumnVisibilityDialog";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { ProfileViewTabs } from "@parallel/components/common/view-tabs/ProfileViewTabs";
import { SaveViewTabsMenu } from "@parallel/components/common/view-tabs/SaveViewMenuButton";
import {
  RedirectError,
  WithApolloDataContext,
  withApolloData,
} from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { withPermission } from "@parallel/components/common/withPermission";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { getProfileTypeFieldIcon } from "@parallel/components/organization/profiles/getProfileTypeFieldIcon";
import { useConfirmChangeViewAllDialog } from "@parallel/components/petition-compose/dialogs/ConfirmChangeViewAllDialog";
import { useAskViewNameDialog } from "@parallel/components/petition-list/AskViewNameDialog";
import { useCreateProfileFromProfileTypeDialog } from "@parallel/components/profiles/dialogs/CreateProfileFromProfileTypeDialog";
import { useImportProfilesFromExcelDialog } from "@parallel/components/profiles/dialogs/ImportProfilesFromExcelDialog";
import { useProfileSubscribersDialog } from "@parallel/components/profiles/dialogs/ProfileSubscribersDialog";
import {
  ConnectionMetadata,
  ProfileListViewData,
  ProfileListViewDataInput,
  ProfileStatus,
  Profiles_ProfileFragment,
  Profiles_ProfileListViewFragment,
  Profiles_createProfileListViewDocument,
  Profiles_profileTypeDocument,
  Profiles_profilesDocument,
  Profiles_updateProfileListViewDocument,
  Profiles_userDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import {
  ProfileFieldValuesFilterCondition,
  ProfileFieldValuesFilterGroup,
  profileFieldValuesFilter,
} from "@parallel/utils/ProfileFieldValuesFilter";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { useCloseProfile } from "@parallel/utils/mutations/useCloseProfile";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { usePermanentlyDeleteProfile } from "@parallel/utils/mutations/usePermanentlyDeleteProfile";
import { useRecoverProfile } from "@parallel/utils/mutations/useRecoverProfile";
import { useReopenProfile } from "@parallel/utils/mutations/useReopenProfile";
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  QueryStateFrom,
  SetQueryState,
  buildStateUrl,
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  useQueryStateSlice,
  values,
} from "@parallel/utils/queryState";
import { useProfilesExcelExportTask } from "@parallel/utils/tasks/useProfilesExcelExportTask";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { usePinProfileType } from "@parallel/utils/usePinProfileType";
import {
  ProfileValueColumnFilter,
  useProfileTableColumns,
} from "@parallel/utils/useProfileTableColumns";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useUnpinProfileType } from "@parallel/utils/useUnpinProfileType";
import { withMetadata } from "@parallel/utils/withMetadata";
import {
  ChangeEvent,
  MouseEvent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDeepEqual, isNonNullish, isNullish, omit, pick, unique } from "remeda";

const SORTING = ["name", "createdAt"] as const;

export const DEFAULT_PROFILE_COLUMN_SELECTION = ["subscribers", "createdAt"];

const QUERY_STATE = {
  view: string(),
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(SORTING),
  type: string(),
  status: values(["OPEN", "CLOSED", "DELETION_SCHEDULED"] as ProfileStatus[]).orDefault("OPEN"),
  columns: string().list({ allowEmpty: true }),
  values: profileFieldValuesFilter(),
};
export type ProfilesQueryState = QueryStateFrom<typeof QUERY_STATE>;

interface ProfilesTableContext {
  status: ProfileStatus;
  setStatus: (status: ProfileStatus) => void;
}

function Profiles() {
  const intl = useIntl();
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);

  const [status, setStatus] = useQueryStateSlice(queryState, setQueryState, "status");
  const navigate = useHandleNavigation();
  const showToast = useToast();

  const userCanCreateProfiles = useHasPermission("PROFILES:CREATE_PROFILES");
  const userCanSubscribeProfiles = useHasPermission("PROFILES:SUBSCRIBE_PROFILES");
  const userCanDeleteProfiles = useHasPermission("PROFILES:DELETE_PROFILES");
  const userCanCloseOpenProfiles = useHasPermission("PROFILES:CLOSE_PROFILES");
  const userCanDeletePermanently = useHasPermission("PROFILES:DELETE_PERMANENTLY_PROFILES");
  const userCanExportProfiles = useHasPermission("PROFILES:EXPORT_PROFILES");

  const { data: queryObject } = useAssertQueryOrPreviousData(Profiles_userDocument, {
    variables: { profileTypeId: queryState.type! },
  });
  const { me } = queryObject;

  const sort = queryState.sort ?? ({ field: "name", direction: "ASC" } as const);

  const {
    data: { profileType },
  } = useAssertQuery(Profiles_profileTypeDocument, {
    variables: { profileTypeId: queryState.type! },
    fetchPolicy: "cache-and-network",
  });

  const [values, setValues] = useQueryStateSlice(queryState, setQueryState, "values");
  const [filter, isAdvancedFilter] = useMemo(() => {
    // check if filter is compatible with column filtering
    const isColumnable =
      isNullish(values) ||
      ("logicalOperator" in values &&
        values.logicalOperator === "AND" &&
        values.conditions.every(
          (c) =>
            "logicalOperator" in c &&
            c.conditions.every((c) => "profileTypeFieldId" in c) &&
            unique(
              (c.conditions as ProfileFieldValuesFilterCondition[]).map(
                (c) => c.profileTypeFieldId,
              ),
            ).length === 1,
        ));
    return [
      isColumnable && isNonNullish(values)
        ? (Object.fromEntries(
            values.conditions.map((c) => {
              const profileTypeFieldId = (
                (c as ProfileFieldValuesFilterGroup)
                  .conditions[0] as ProfileFieldValuesFilterCondition
              ).profileTypeFieldId;
              return [`field_${profileTypeFieldId}`, c];
            }),
          ) as Record<string, ProfileValueColumnFilter>)
        : {},
      !isColumnable,
    ] as const;
  }, [values]);
  const handleFilterChange = useCallback(
    (key: string, value: ProfileValueColumnFilter) => {
      if (key.startsWith("field_")) {
        const conditions = Object.values({
          ...(filter ?? {}),
          [key]: value.conditions.length > 0 ? value : null,
        }).filter(isNonNullish);
        setValues(
          conditions.length > 0
            ? {
                logicalOperator: "AND",
                conditions,
              }
            : null,
        );
      }
    },
    [filter],
  );

  const { data, loading, refetch } = useQueryOrPreviousData(Profiles_profilesDocument, {
    variables: {
      offset: queryState.items * (queryState.page - 1),
      limit: queryState.items,
      search: queryState.search,
      sortBy: [`${sort.field}_${sort.direction}` as const],
      filter: {
        profileTypeId: [queryState.type!],
        status: [queryState.status],
        values,
      },
      propertiesFilter:
        queryState.columns
          ?.filter((c) => c.startsWith("field_"))
          ?.map((c) => ({ profileTypeFieldId: c.slice("field_".length) })) ?? [],
    },
    fetchPolicy: "cache-and-network",
  });

  const profiles = data?.profiles;

  const { selectedIds, selectedRows, onChangeSelectedIds } = useSelection(profiles?.items, "id");

  const columns = useProfileTableColumns(profileType);
  const selection = queryState.columns ?? DEFAULT_PROFILE_COLUMN_SELECTION;

  const showCreateProfileFromProfileTypeDialog = useCreateProfileFromProfileTypeDialog();
  const handleCreateProfile = async () => {
    if (isNullish(profileType)) {
      return;
    }
    try {
      const {
        hasValues,
        profile: { id },
      } = await showCreateProfileFromProfileTypeDialog({
        profileTypeId: profileType.id,
        profileTypeName: profileType.name,
      });
      if (hasValues) {
        navigate(`/app/profiles/${id}/general`);
      }
    } catch {}
  };

  const deleteProfile = useDeleteProfile();
  const permanentlyDeleteProfile = usePermanentlyDeleteProfile();
  const handleDeleteClick = async () => {
    try {
      if (status === "DELETION_SCHEDULED") {
        await permanentlyDeleteProfile({
          profileIds: selectedIds,
          profileName: <ProfileReference profile={selectedRows[0]} showNameEvenIfDeleted />,
        });
      } else {
        await deleteProfile({
          profileIds: selectedIds,
        });
      }

      refetch();
    } catch {}
  };

  const handleRowClick = useCallback((row: Profiles_ProfileFragment, event: MouseEvent) => {
    navigate(`/app/profiles/${row.id}/general`, event);
  }, []);

  const showSubscribersDialog = useProfileSubscribersDialog();
  const handleSubscribeClick = useCallback(async () => {
    const isSubscribed = selectedRows.every((row) =>
      row.subscribers.some((s) => s.user.id === me!.id),
    )
      ? true
      : selectedRows.every((row) => row.subscribers.every((s) => s.user.id !== me!.id))
        ? false
        : undefined;
    try {
      await showSubscribersDialog({
        me,
        profileIds: selectedIds,
        users:
          selectedRows.length === 1
            ? selectedRows[0].subscribers.map((s) => s.user)
            : isSubscribed
              ? [me]
              : ([] as any),
        isSubscribed,
      });
    } catch {}
  }, [selectedRows, selectedIds.join(",")]);

  const context = useMemo<ProfilesTableContext>(
    () => ({ status, setStatus, profileType }),
    [status, setStatus, profileType],
  );

  const reopenProfile = useReopenProfile();
  const handleReopenClick = async () => {
    try {
      await reopenProfile({
        profileIds: selectedIds,
        profileName: <ProfileReference profile={selectedRows[0]} />,
      });
      refetch();
    } catch {}
  };

  const recoverProfile = useRecoverProfile();
  const handleRecoverClick = async () => {
    try {
      await recoverProfile({
        profileIds: selectedIds,
        profileName: <ProfileReference profile={selectedRows[0]} showNameEvenIfDeleted />,
      });
      refetch();
    } catch {}
  };

  const closeProfile = useCloseProfile();
  const handleCloseClick = async () => {
    try {
      await closeProfile({
        profileIds: selectedIds,
        profileName: <ProfileReference profile={selectedRows[0]} />,
      });
      refetch();
    } catch {}
  };

  const unpinProfileType = useUnpinProfileType();
  const pinProfileType = usePinProfileType();

  const handlePinAndUnpinProfileType = async () => {
    if (isNullish(profileType)) {
      return;
    }
    try {
      if (profileType.isPinned) {
        await unpinProfileType(profileType.id);
      } else {
        await pinProfileType(profileType.id);
      }
    } catch {}
  };

  const showImportProfilesFromExcelDialog = useImportProfilesFromExcelDialog();
  const handleImportProfilesFromExcel = async () => {
    if (isNullish(profileType)) {
      return;
    }
    try {
      const { count } = await showImportProfilesFromExcelDialog({ profileTypeId: profileType.id });
      if (count > 0) {
        showToast({
          title: intl.formatMessage(
            {
              id: "page.profiles.successful-import-toast-title",
              defaultMessage:
                "{count, plural, =1{# profile} other{# profiles}} imported successfully!",
            },
            { count },
          ),
          status: "success",
        });
        await refetch();
      }
    } catch {}
  };

  const [handleExportProfilesToExcelTask] = useProfilesExcelExportTask();

  const showColumnVisibilityDialog = useColumnVisibilityDialog();
  const handleEditColumns = async () => {
    try {
      const newColumns = await showColumnVisibilityDialog({
        columns,
        selection,
      });
      setQueryState((current) => ({ ...current, columns: newColumns }));
    } catch {}
  };

  const actions = useProfileListActions({
    canDelete: userCanDeleteProfiles,
    canCloseOpen: userCanCloseOpenProfiles,
    canDeletePermanently: userCanDeletePermanently,
    canSubscribeUsers: userCanSubscribeProfiles,
    onDeleteClick: handleDeleteClick,
    onSubscribeClick: handleSubscribeClick,
    onCloseClick: handleCloseClick,
    onReopenClick: handleReopenClick,
    onRecoverClick: handleRecoverClick,
    status,
    selectedCount: selectedIds.length,
  });

  const icon = getProfileTypeFieldIcon(profileType?.icon);

  const sortedAndFilteredColumns = useMemo(() => {
    return ["name", ...(selection ?? [])]
      .map((key) => columns.find((c) => c.key === key))
      .filter(isNonNullish);
  }, [selection?.join(",")]);

  return (
    <AppLayout
      title={intl.formatMessage({ id: "page.profiles.title", defaultMessage: "Profiles" })}
      queryObject={queryObject}
    >
      <Stack flex={1} minHeight={0} paddingX={4} paddingTop={6} spacing={4}>
        <Flex alignItems="center">
          <HStack padding={2}>
            <Icon as={icon} boxSize={5} />
            <Heading as="h2" size="lg">
              {profileType ? <ProfileTypeReference profileType={profileType} usePlural /> : null}
            </Heading>
            <IconButtonWithTooltip
              variant="ghost"
              rounded="full"
              sx={{
                ...(profileType?.isPinned
                  ? {
                      "svg > g": {
                        stroke: "purple.600",
                        fill: "purple.600",
                      },
                    }
                  : {}),
              }}
              size="sm"
              icon={<PinIcon boxSize={4} />}
              label={
                profileType?.isPinned
                  ? intl.formatMessage({
                      id: "page.profiles.remove-from-menu",
                      defaultMessage: "Remove from menu",
                    })
                  : intl.formatMessage({
                      id: "page.profiles.pin-to-menu",
                      defaultMessage: "Pin to menu",
                    })
              }
              onClick={handlePinAndUnpinProfileType}
            />
          </HStack>
          <Spacer minW={4} />
          <Box>
            <ButtonWithMoreOptions
              colorScheme="primary"
              onClick={handleCreateProfile}
              isDisabled={
                !userCanCreateProfiles || isNullish(profileType) || !profileType.canCreate
              }
              options={
                <MenuList minWidth={0}>
                  <MenuItem onClick={handleImportProfilesFromExcel}>
                    <FormattedMessage
                      id="page.profiles.import-from-excel"
                      defaultMessage="Import from Excel"
                    />
                  </MenuItem>
                  {userCanExportProfiles ? (
                    <MenuItem
                      onClick={() =>
                        handleExportProfilesToExcelTask({
                          locale: intl.locale as UserLocale,
                          profileTypeId: queryState.type!,
                          profileTypeFieldIds:
                            queryState.columns
                              ?.filter((c) => c.startsWith("field_"))
                              .map((c) => c.slice("field_".length)) ?? [],
                          values: queryState.values,
                          status: [queryState.status],
                          search: queryState.search,
                          sortBy: queryState.sort,
                        })
                      }
                    >
                      <FormattedMessage
                        id="page.profiles.export-to-excel"
                        defaultMessage="Export to Excel"
                      />
                    </MenuItem>
                  ) : null}
                </MenuList>
              }
            >
              <FormattedMessage
                id="generic.create-name"
                defaultMessage="Create {name}"
                values={{
                  name: profileType
                    ? localizableUserTextRender({
                        value: profileType.name,
                        intl,
                        default: intl.formatMessage({
                          id: "generic.unnamed-profile-type",
                          defaultMessage: "Unnamed profile type",
                        }),
                      }).toLowerCase()
                    : "",
                }}
              />
            </ButtonWithMoreOptions>
          </Box>
        </Flex>
        <Flex direction="column" flex={1} minHeight={0} paddingBottom={16}>
          <TablePage
            flex="0 1 auto"
            columns={sortedAndFilteredColumns}
            rows={profiles?.items}
            rowKeyProp="id"
            context={context}
            isSelectable
            isHighlightable
            loading={loading}
            onRowClick={handleRowClick}
            onSelectionChange={onChangeSelectedIds}
            sort={sort}
            filter={filter}
            onFilterChange={handleFilterChange}
            page={queryState.page}
            pageSize={queryState.items}
            totalCount={profiles?.totalCount}
            onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
            onPageSizeChange={(items) =>
              setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
            }
            onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
            actions={actions}
            header={
              <>
                <ProfileViewTabs
                  state={queryState}
                  onStateChange={setQueryState}
                  views={me.profileListViews}
                  profileTypeId={profileType.id}
                />
                <ProfilesListHeader
                  state={queryState}
                  columns={columns}
                  filter={filter}
                  isAdvancedFilter={isAdvancedFilter}
                  selection={selection}
                  onStateChange={setQueryState}
                  onReload={refetch}
                  onEditColumns={handleEditColumns}
                  views={me.profileListViews}
                  profileTypeId={profileType.id}
                />
              </>
            }
            body={
              profiles && profiles.totalCount === 0 && !loading ? (
                queryState.search || queryState.values ? (
                  <Center flex="1" minHeight="200px">
                    <Text color="gray.400" fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-results"
                        defaultMessage="There are no profiles matching your criteria"
                      />
                    </Text>
                  </Center>
                ) : queryState.status === "OPEN" ? (
                  <Center flex="1" minHeight="200px">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-profiles"
                        defaultMessage="You have no profiles yet. Start by creating one now!"
                      />
                    </Text>
                  </Center>
                ) : queryState.status === "CLOSED" ? (
                  <Center flex="1" minHeight="200px">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-closed-profiles"
                        defaultMessage="There are no closed profiles"
                      />
                    </Text>
                  </Center>
                ) : queryState.status === "DELETION_SCHEDULED" ? (
                  <Center flex="1" minHeight="200px">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-deleted-profiles"
                        defaultMessage="There are no profiles in the bin"
                      />
                    </Text>
                  </Center>
                ) : null
              ) : null
            }
            Footer={CustomFooter}
          />
        </Flex>
      </Stack>
    </AppLayout>
  );
}

function CustomFooter({ status, setStatus, children }: PropsWithChildren<ProfilesTableContext>) {
  const options = useSimpleSelectOptions<ProfileStatus>(
    (intl) => [
      {
        label: intl.formatMessage({ id: "page.profiles.open", defaultMessage: "Open" }),
        value: "OPEN",
      },
      {
        label: intl.formatMessage({
          id: "page.profiles.closed",
          defaultMessage: "Closed",
        }),
        value: "CLOSED",
      },

      {
        label: intl.formatMessage({
          id: "page.profiles.bin",
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
        value={status}
        onChange={setStatus as any}
        size="sm"
        variant="ghost"
      />
      {children}
    </>
  );
}

function useProfileListActions({
  onDeleteClick,
  onSubscribeClick,
  onCloseClick,
  onReopenClick,
  onRecoverClick,
  canSubscribeUsers,
  canDelete,
  canCloseOpen,
  canDeletePermanently,
  status,
  selectedCount,
}: {
  onDeleteClick: () => void;
  onSubscribeClick: () => void;
  onCloseClick: () => void;
  onReopenClick: () => void;
  onRecoverClick: () => void;
  canSubscribeUsers: boolean;
  canDelete: boolean;
  canCloseOpen: boolean;
  canDeletePermanently: boolean;
  status: ProfileStatus;
  selectedCount: number;
}) {
  return [
    ...(status === "OPEN"
      ? [
          {
            key: "subscribe",
            onClick: onSubscribeClick,
            leftIcon: <BellIcon />,
            children: <FormattedMessage id="generic.subscribe" defaultMessage="Subscribe" />,
            isDisabled: !canSubscribeUsers,
          },
          {
            key: "close",
            onClick: onCloseClick,
            leftIcon: <ArchiveIcon />,
            children: (
              <FormattedMessage
                id="page.profiles.close-profile"
                defaultMessage="Close {count, plural, =1 {profile} other {profiles}}"
                values={{ count: selectedCount }}
              />
            ),
            isDisabled: !canCloseOpen,
          },
          {
            key: "delete",
            onClick: onDeleteClick,
            leftIcon: <DeleteIcon />,
            children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
            colorScheme: "red",
            isDisabled: !canDelete,
          },
        ]
      : []),
    ...(status === "CLOSED"
      ? [
          {
            key: "reopen",
            onClick: onReopenClick,
            leftIcon: <ArchiveIcon />,
            children: (
              <FormattedMessage
                id="page.profiles.reopen-profile"
                defaultMessage="Reopen {count, plural, =1 {profile} other {profiles}}"
                values={{ count: selectedCount }}
              />
            ),
            isDisabled: !canCloseOpen,
          },
          {
            key: "delete",
            onClick: onDeleteClick,
            leftIcon: <DeleteIcon />,
            children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
            colorScheme: "red",
            isDisabled: !canDelete,
          },
        ]
      : []),
    ...(status === "DELETION_SCHEDULED"
      ? [
          {
            key: "recover",
            onClick: onRecoverClick,
            leftIcon: <ArchiveIcon />,
            children: (
              <FormattedMessage
                id="page.profiles.recover-profile"
                defaultMessage="Recover {count, plural, =1 {profile} other {profiles}}"
                values={{ count: selectedCount }}
              />
            ),
            isDisabled: !canCloseOpen,
          },
          {
            key: "delete",
            onClick: onDeleteClick,
            leftIcon: <DeleteIcon />,
            children: (
              <FormattedMessage
                id="page.profiles.delete-permanently"
                defaultMessage="Delete permanently"
              />
            ),
            colorScheme: "red",
            isDisabled: !canDeletePermanently,
          },
        ]
      : []),
  ];
}

interface ProfilesListHeaderProps {
  state: ProfilesQueryState;
  profileTypeId: string;
  views: Profiles_ProfileListViewFragment[];
  columns: TableColumn<any, any, any>[];
  filter: Record<string, ProfileValueColumnFilter>;
  isAdvancedFilter: boolean;
  selection: string[];
  onStateChange: SetQueryState<Partial<ProfilesQueryState>>;
  onReload: () => void;
  onEditColumns: () => void;
}

function ProfilesListHeader({
  state,
  profileTypeId,
  columns,
  filter,
  isAdvancedFilter,
  selection,
  views,
  onStateChange,
  onReload,
  onEditColumns,
}: ProfilesListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(state.search ?? "");
  const saveViewRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSearch(state.search ?? "");
  }, [state.view]);

  const debouncedOnSearchChange = useDebouncedCallback(
    (search) =>
      onStateChange(({ ...current }) => ({
        ...current,
        search,
        page: 1,
      })),
    300,
    [onStateChange],
  );

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange],
  );

  const isViewDirty = useMemo(() => {
    const currentView = views.find((v) =>
      state.view === "ALL" ? v.type === "ALL" : v.id === state.view,
    );

    if (!currentView) return false;

    if (currentView.type === "ALL") {
      // "ALL" view can only update columns and sortBy
      return !viewsAreEqual(
        pick(currentView.data, ["sort", "columns"]),
        pick(state, ["sort", "columns"]),
      );
    }

    return !viewsAreEqual(currentView!.data, {
      ...(pick(state, ["search", "sort", "columns", "status", "values"]) as Omit<
        ProfileListViewData,
        "__typename"
      >),
    });
  }, [state, views]);

  const [updateProfileListView] = useMutation(Profiles_updateProfileListViewDocument);
  const showConfirmChangeViewAllDialog = useConfirmChangeViewAllDialog();

  const handleSaveCurrentView = async () => {
    try {
      // If the view to save is ALL and has some filter applied, show the dialog
      // to choose whether to save and ignore the filters or switch to create a new VIEW.

      if (
        state.view === "ALL" &&
        Object.values(pick(state, ["search", "status"])).some(isNonNullish)
      ) {
        const action = await showConfirmChangeViewAllDialog({
          modalProps: { finalFocusRef: saveViewRef },
        });
        if (action === "CREATE_NEW_VIEW") {
          handleSaveViewAsNew();
          return;
        }
      }
      const view = views.find((v) =>
        state.view === "ALL" ? v.type === "ALL" : v.id === state.view,
      )!;
      await updateProfileListView({
        variables: {
          profileListViewId: view.id,
          profileTypeId,
          ...(view.type === "ALL" ? {} : { name: view.name }),
          data: (view.type === "ALL"
            ? pick(state, ["sort", "columns"])
            : pick(state, [
                "sort",
                "columns",
                "search",
                "status",
                "values",
              ])) as ProfileListViewDataInput,
        },
      });
    } catch {}
  };

  const showAskViewNameDialog = useAskViewNameDialog();
  const [createProfileListView] = useMutation(Profiles_createProfileListViewDocument);
  const handleSaveViewAsNew = async () => {
    const currentView = state.view !== "ALL" ? views.find((v) => v.id === state.view) : null;
    try {
      const name = await showAskViewNameDialog({
        name: currentView?.name,
        header: (
          <FormattedMessage
            id="component.petition-list-header.save-as-new-view-header"
            defaultMessage="Create new view"
          />
        ),
        confirm: (
          <FormattedMessage
            id="component.petition-list-header.save-as-new-view-confirm-button"
            defaultMessage="Create view"
          />
        ),
        modalProps: { finalFocusRef: saveViewRef },
      });
      const { data } = await createProfileListView({
        variables: {
          profileTypeId,
          name,
          data: {
            ...pick(state, ["sort", "columns", "search", "status", "values"]),
          } as ProfileListViewDataInput,
        },
      });
      if (isNonNullish(data)) {
        onStateChange({
          ...state,
          view: data.createProfileListView.id,
          columns: data.createProfileListView.data.columns,
          search: data.createProfileListView.data.search,
          sort: isNonNullish(data.createProfileListView.data.sort)
            ? omit(data.createProfileListView.data.sort, ["__typename"])
            : undefined,
          status: data.createProfileListView.data.status ?? "OPEN",
          values: data.createProfileListView.data.values as any,
        });
      }
    } catch {}
  };

  return (
    <HStack padding={2}>
      <IconButtonWithTooltip
        onClick={() => onReload()}
        icon={<RepeatIcon />}
        placement="bottom"
        variant="outline"
        label={intl.formatMessage({
          id: "generic.reload-data",
          defaultMessage: "Reload",
        })}
      />
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={handleSearchChange} />
      </Box>
      <HiddenFiltersButton
        columns={columns}
        selection={selection}
        filter={filter}
        onRemoveFilter={(key) => {
          onStateChange((current) => ({
            ...current,
            values: {
              logicalOperator: "AND",
              conditions: Object.values(omit(filter, [key])),
            },
            page: 1,
          }));
        }}
      />
      {isAdvancedFilter ? (
        <>
          <Alert flex={0} rounded="md" status="info" paddingX={2} height="40px" paddingY={1}>
            <AlertIcon boxSize={4} marginEnd={2} />
            <HStack>
              <AlertDescription fontSize="sm" whiteSpace="nowrap">
                <FormattedMessage id="generic.advanced-filter" defaultMessage="Advanced filter" />
              </AlertDescription>
              <Button
                variant="outline"
                size="sm"
                background="white"
                onClick={() =>
                  onStateChange((current) => ({ ...omit(current, ["values"]), page: 1 }))
                }
              >
                <FormattedMessage id="generic.remove" defaultMessage="Remove" />
              </Button>
            </HStack>
          </Alert>
        </>
      ) : null}

      <HStack flex={1} justifyContent="flex-end">
        <ResponsiveButtonIcon
          icon={<ColumnsIcon />}
          variant="outline"
          data-action="edit-columns"
          onClick={onEditColumns}
          label={intl.formatMessage({
            id: "generic.edit-columns",
            defaultMessage: "Edit columns",
          })}
        />
        <SaveViewTabsMenu
          ref={saveViewRef}
          isViewDirty={isViewDirty}
          onSaveAsNewView={handleSaveViewAsNew}
          onSaveCurrentView={handleSaveCurrentView}
        />
      </HStack>
    </HStack>
  );
}

function viewsAreEqual(view1: Partial<ProfileListViewData>, view2: Partial<ProfileListViewData>) {
  return (
    isDeepEqual(omit(view1, ["__typename", "sort"]), omit(view2, ["__typename", "sort"])) &&
    isDeepEqual(
      isNonNullish(view1.sort)
        ? omit(view1.sort, ["__typename"])
        : { field: "createdAt", direction: "DESC" },
      isNonNullish(view2.sort)
        ? omit(view2.sort, ["__typename"])
        : { field: "createdAt", direction: "DESC" },
    )
  );
}

const _fragments = {
  get ProfileType() {
    return gql`
      fragment Profiles_ProfileType on ProfileType {
        id
        name
        icon
        isPinned
        canCreate
        ...ProfileTypeReference_ProfileType
        ...useProfileTableColumns_ProfileType
      }
      ${ProfileTypeReference.fragments.ProfileType}
      ${useProfileTableColumns.fragments.ProfileType}
    `;
  },
  get Profile() {
    return gql`
      fragment Profiles_Profile on Profile {
        id
        status
        ...ProfileReference_Profile
        profileType {
          id
          name
        }
        ...useProfileTableColumns_Profile
      }
      ${ProfileReference.fragments.Profile}
      ${useProfileTableColumns.fragments.Profile}
    `;
  },
  get ProfileListView() {
    return gql`
      fragment Profiles_ProfileListView on ProfileListView {
        id
        ...ProfileViewTabs_ProfileListView
        data {
          columns
          search
          sort {
            field
            direction
          }
          status
          values
        }
      }
      ${ProfileViewTabs.fragments.ProfileListView}
    `;
  },
};

const _queries = [
  gql`
    query Profiles_user($profileTypeId: GID!) {
      ...AppLayout_Query
      me {
        id
        ...useProfileSubscribersDialog_User
        profileListViews(profileTypeId: $profileTypeId) {
          ...Profiles_ProfileListView
        }
      }
      metadata {
        browserName
        country
      }
    }
    ${AppLayout.fragments.Query}
    ${useProfileSubscribersDialog.fragments.User}
    ${_fragments.ProfileListView}
  `,
  gql`
    query Profiles_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        ...Profiles_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
  gql`
    query Profiles_profiles(
      $offset: Int
      $limit: Int
      $search: String
      $sortBy: [QueryProfiles_OrderBy!]
      $filter: ProfileFilter
      $propertiesFilter: [ProfileFieldPropertyFilter!]
    ) {
      profiles(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy, filter: $filter) {
        items {
          ...Profiles_Profile
          properties(filter: $propertiesFilter) {
            ...useProfileTableColumns_ProfileFieldProperty
          }
        }
        totalCount
      }
    }
    ${_fragments.Profile}
    ${useProfileTableColumns.fragments.ProfileFieldProperty}
  `,
];

const _mutations = [
  gql`
    mutation Profiles_createProfileListView(
      $profileTypeId: GID!
      $name: String!
      $data: ProfileListViewDataInput!
    ) {
      createProfileListView(profileTypeId: $profileTypeId, name: $name, data: $data) {
        id
        ...Profiles_ProfileListView
        user {
          id
          profileListViews(profileTypeId: $profileTypeId) {
            id
          }
        }
      }
    }
    ${_fragments.ProfileListView}
  `,
  gql`
    mutation Profiles_updateProfileListView(
      $profileTypeId: GID!
      $profileListViewId: GID!
      $name: String
      $data: ProfileListViewDataInput
    ) {
      updateProfileListView(
        profileTypeId: $profileTypeId
        profileListViewId: $profileListViewId
        name: $name
        data: $data
      ) {
        id
        ...Profiles_ProfileListView
      }
    }
    ${_fragments.ProfileListView}
  `,
];

Profiles.getInitialProps = async ({ query, pathname, fetchQuery }: WithApolloDataContext) => {
  const state = parseQuery(query, QUERY_STATE);
  if (isNullish(state.type)) {
    throw new RedirectError("/app");
  }
  let views: Profiles_ProfileListViewFragment[];
  let metadata: ConnectionMetadata;
  try {
    const [{ data }] = await Promise.all([
      fetchQuery(Profiles_userDocument, { variables: { profileTypeId: state.type } }),
      fetchQuery(Profiles_profileTypeDocument, { variables: { profileTypeId: state.type } }),
    ]);
    views = data.me.profileListViews;
    metadata = data.metadata;
  } catch {
    throw new RedirectError("/app");
  }

  if (isNullish(state.view) && isNonNullish(views)) {
    const defaultView = views.find((v) => v.isDefault);
    if (isNonNullish(defaultView)) {
      throw new RedirectError(
        buildStateUrl(
          QUERY_STATE,
          {
            ...state,
            view: defaultView.id,
            search: defaultView.data.search,
            columns: defaultView.data.columns,
            sort: isNonNullish(defaultView.data.sort)
              ? omit(defaultView.data.sort, ["__typename"])
              : undefined,
            status: defaultView.data.status ?? "OPEN",
            values: defaultView.data.values as any,
          },
          pathname,
          query,
        ),
      );
    } else {
      const allView = views.find((v) => v.type === "ALL");

      if (allView) {
        throw new RedirectError(
          buildStateUrl(
            QUERY_STATE,
            {
              ...state,
              view: "ALL",
              ...omit(allView.data, ["__typename", "sort"]),
              sort: isNonNullish(allView.data.sort)
                ? omit(allView.data.sort, ["__typename"])
                : undefined,
              status: allView.data.status ?? "OPEN",
              values: allView.data.values as any,
            },
            pathname,
            query,
          ),
        );
      } else {
        throw new RedirectError(
          buildStateUrl(
            QUERY_STATE,
            {
              ...state,
              view: "ALL",
            },
            pathname,
            query,
          ),
        );
      }
    }
  } else if (state.view !== "ALL") {
    const view = views.find((v) => v.id === state.view);
    if (isNullish(view)) {
      throw new RedirectError(
        buildStateUrl(QUERY_STATE, { ...state, view: "ALL" }, pathname, query),
      );
    }
  }
  return { metadata };
};

export default compose(
  withDialogs,
  withMetadata,
  withPermission("PROFILES:LIST_PROFILES"),
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData,
)(Profiles);
