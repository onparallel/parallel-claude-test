import { gql } from "@apollo/client";
import {
  Box,
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
import { ArchiveIcon, BellIcon, DeleteIcon, PinIcon, RepeatIcon } from "@parallel/chakra/icons";
import { ButtonWithMoreOptions } from "@parallel/components/common/ButtonWithMoreOptions";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { ProfileTypeReference } from "@parallel/components/common/ProfileTypeReference";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { SimpleMenuSelect } from "@parallel/components/common/SimpleMenuSelect";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import {
  RedirectError,
  WithApolloDataContext,
  withApolloData,
} from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { withPermission } from "@parallel/components/common/withPermission";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { getProfileTypeFieldIcon } from "@parallel/components/organization/profiles/getProfileTypeFieldIcon";
import { useCreateProfileFromProfileTypeDialog } from "@parallel/components/profiles/dialogs/CreateProfileFromProfileTypeDialog";
import { useImportProfilesFromExcelDialog } from "@parallel/components/profiles/dialogs/ImportProfilesFromExcelDialog";
import { useProfileSubscribersDialog } from "@parallel/components/profiles/dialogs/ProfileSubscribersDialog";
import {
  ProfileStatus,
  Profiles_ProfileFragment,
  Profiles_profileTypeDocument,
  Profiles_profilesDocument,
  Profiles_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useCloseProfile } from "@parallel/utils/mutations/useCloseProfile";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { usePermanentlyDeleteProfile } from "@parallel/utils/mutations/usePermanentlyDeleteProfile";
import { useRecoverProfile } from "@parallel/utils/mutations/useRecoverProfile";
import { useReopenProfile } from "@parallel/utils/mutations/useReopenProfile";
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  QueryStateFrom,
  QueryStateOf,
  SetQueryState,
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  useQueryStateSlice,
  values,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { usePinProfileType } from "@parallel/utils/usePinProfileType";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useUnpinProfileType } from "@parallel/utils/useUnpinProfileType";
import { ChangeEvent, MouseEvent, PropsWithChildren, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNullish } from "remeda";

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "DESC",
  }),
  type: string(),
  status: values(["OPEN", "CLOSED", "DELETION_SCHEDULED"]).orDefault("OPEN"),
};
type ProfilesQueryState = QueryStateFrom<typeof QUERY_STATE>;

interface ProfilesTableContext {
  status: ProfileStatus;
  setStatus: (status: ProfileStatus) => void;
}
function Profiles() {
  const intl = useIntl();
  const { data: queryObject } = useAssertQuery(Profiles_userDocument);
  const { me } = queryObject;
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [status, setStatus] = useQueryStateSlice(queryState, setQueryState, "status");
  const navigate = useHandleNavigation();
  const showToast = useToast();

  const userCanCreateProfiles = useHasPermission("PROFILES:CREATE_PROFILES");
  const userCanSubscribeProfiles = useHasPermission("PROFILES:SUBSCRIBE_PROFILES");
  const userCanDeleteProfiles = useHasPermission("PROFILES:DELETE_PROFILES");
  const userCanCloseOpenProfiles = useHasPermission("PROFILES:CLOSE_PROFILES");
  const userCanDeletePermanently = useHasPermission("PROFILES:DELETE_PERMANENTLY_PROFILES");

  const { data, loading, refetch } = useQueryOrPreviousData(Profiles_profilesDocument, {
    variables: {
      offset: queryState.items * (queryState.page - 1),
      limit: queryState.items,
      search: queryState.search,
      sortBy: [`${queryState.sort.field}_${queryState.sort.direction}` as const],
      filter: {
        profileTypeId: [queryState.type!],
        status: [queryState.status],
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: _profileTypeData } = useQueryOrPreviousData(Profiles_profileTypeDocument, {
    variables: {
      profileTypeId: queryState.type!,
    },
    fetchPolicy: "cache-and-network",
  });

  const profiles = data?.profiles;

  const profileType = _profileTypeData?.profileType ?? null;

  const { selectedIds, selectedRows, onChangeSelectedIds } = useSelection(profiles?.items, "id");

  const columns = useProfileTableColumns(status);

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

  const context = useMemo<ProfilesTableContext>(() => ({ status, setStatus }), [status, setStatus]);

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

  return (
    <AppLayout
      title={intl.formatMessage({ id: "page.profiles.title", defaultMessage: "Profiles" })}
      queryObject={queryObject}
    >
      <Stack minHeight={0} paddingX={4} paddingTop={6} spacing={4}>
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
        <Box flex="1" paddingBottom={16}>
          <TablePage
            flex="0 1 auto"
            columns={columns}
            rows={profiles?.items}
            rowKeyProp="id"
            context={context}
            isSelectable
            isHighlightable
            loading={loading}
            onRowClick={handleRowClick}
            page={queryState.page}
            pageSize={queryState.items}
            totalCount={profiles?.totalCount}
            onSelectionChange={onChangeSelectedIds}
            sort={queryState.sort}
            onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
            onPageSizeChange={(items) =>
              setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
            }
            onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
            actions={actions}
            header={
              <ProfilesListHeader
                shape={QUERY_STATE}
                state={queryState}
                onStateChange={setQueryState}
                onReload={refetch}
              />
            }
            body={
              profiles && profiles.totalCount === 0 && !loading ? (
                queryState.search ? (
                  <Center flex="1">
                    <Text color="gray.400" fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-results"
                        defaultMessage="There's no profiles matching your criteria"
                      />
                    </Text>
                  </Center>
                ) : queryState.status === "OPEN" ? (
                  <Center flex="1">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-profiles"
                        defaultMessage="You have no profiles yet. Start by creating one now!"
                      />
                    </Text>
                  </Center>
                ) : queryState.status === "CLOSED" ? (
                  <Center flex="1">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-closed-profiles"
                        defaultMessage="There is no closed profile"
                      />
                    </Text>
                  </Center>
                ) : queryState.status === "DELETION_SCHEDULED" ? (
                  <Center flex="1">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-deleted-profiles"
                        defaultMessage="No profile in the bin"
                      />
                    </Text>
                  </Center>
                ) : null
              ) : null
            }
            Footer={CustomFooter}
          />
        </Box>
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
  shape: QueryStateOf<ProfilesQueryState>;
  state: ProfilesQueryState;
  onStateChange: SetQueryState<Partial<ProfilesQueryState>>;
  onReload: () => void;
}

function ProfilesListHeader({ shape, state, onStateChange, onReload }: ProfilesListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(state.search ?? "");

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
    </HStack>
  );
}

export function useProfileTableColumns(
  status: ProfileStatus,
): TableColumn<Profiles_ProfileFragment, ProfilesTableContext>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        label: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        headerProps: {
          minWidth: "240px",
        },
        cellProps: {
          maxWidth: 0,
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <OverflownText>
              <ProfileReference
                profile={row}
                showNameEvenIfDeleted={status === "DELETION_SCHEDULED"}
              />
            </OverflownText>
          );
        },
      },
      {
        key: "type",
        label: intl.formatMessage({
          id: "component.profile-table-columns.type",
          defaultMessage: "Type",
        }),
        headerProps: {
          minWidth: "240px",
        },
        cellProps: {
          maxWidth: 0,
          minWidth: "240px",
        },
        CellContent: ({
          row: {
            profileType: { name },
          },
        }) => {
          return (
            <OverflownText textStyle={name ? undefined : "hint"}>
              {localizableUserTextRender({
                value: name,
                intl,
                default: intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                }),
              })}
            </OverflownText>
          );
        },
      },
      ...(status === "OPEN"
        ? ([
            {
              key: "subscribed",
              header: intl.formatMessage({
                id: "component.profile-table-columns.subscribed",
                defaultMessage: "Subscribed",
              }),
              align: "left",
              headerProps: { minWidth: "132px" },
              cellProps: { minWidth: "132px" },
              CellContent: ({ row, column }) => {
                const { subscribers } = row;

                if (!subscribers?.length) {
                  return <></>;
                }
                return (
                  <Flex justifyContent={column.align}>
                    <UserAvatarList usersOrGroups={subscribers?.map((s) => s.user)} />
                  </Flex>
                );
              },
            },
          ] as TableColumn<Profiles_ProfileFragment, ProfilesTableContext>[])
        : ([] as TableColumn<Profiles_ProfileFragment, ProfilesTableContext>[])),
      {
        key: "createdAt",
        isSortable: true,
        label: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        headerProps: {
          minWidth: "160px",
        },
        cellProps: {
          minWidth: "160px",
        },
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
        ),
      },
    ],
    [intl.locale, status],
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
      }
      ${ProfileTypeReference.fragments.ProfileType}
    `;
  },
  get Profile() {
    return gql`
      fragment Profiles_Profile on Profile {
        id
        localizableName
        status
        ...ProfileReference_Profile
        profileType {
          id
          name
        }
        subscribers {
          id
          user {
            id
            ...UserAvatarList_User
            ...useProfileSubscribersDialog_User
          }
        }
        createdAt
      }
      ${ProfileReference.fragments.Profile}
      ${UserAvatarList.fragments.User}
      ${useProfileSubscribersDialog.fragments.User}
    `;
  },
  get ProfilePagination() {
    return gql`
      fragment Profiles_ProfilePagination on ProfilePagination {
        items {
          ...Profiles_Profile
        }
        totalCount
      }
      ${this.Profile}
    `;
  },
};

const _queries = [
  gql`
    query Profiles_user {
      ...AppLayout_Query
      me {
        ...useProfileSubscribersDialog_User
      }
    }
    ${AppLayout.fragments.Query}
    ${useProfileSubscribersDialog.fragments.User}
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
    ) {
      profiles(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy, filter: $filter) {
        ...Profiles_ProfilePagination
      }
    }
    ${_fragments.ProfilePagination}
  `,
];

Profiles.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const state = parseQuery(query, QUERY_STATE);
  if (isNullish(state.type)) {
    throw new RedirectError("/app");
  }
  try {
    await Promise.all([
      fetchQuery(Profiles_userDocument),
      fetchQuery(Profiles_profileTypeDocument, { variables: { profileTypeId: state.type } }),
      fetchQuery(Profiles_profilesDocument, {
        variables: {
          offset: state.items * (state.page - 1),
          limit: state.items,
          search: state.search,
          sortBy: [`${state.sort.field}_${state.sort.direction}` as const],
          filter: {
            profileTypeId: [state.type],
            status: [state.status],
          },
        },
      }),
    ]);
  } catch {
    throw new RedirectError("/app");
  }
  return {};
};

export default compose(
  withDialogs,
  withPermission("PROFILES:LIST_PROFILES"),
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData,
)(Profiles);
