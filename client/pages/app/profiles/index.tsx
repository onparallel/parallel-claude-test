import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  ArchiveIcon,
  BellIcon,
  ChevronDownIcon,
  DeleteIcon,
  RepeatIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
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
import { useCreateProfileDialog } from "@parallel/components/profiles/dialogs/CreateProfileDialog";
import { useProfileSubscribersDialog } from "@parallel/components/profiles/dialogs/ProfileSubscribersDialog";
import {
  ProfileStatus,
  Profiles_ProfileFragment,
  Profiles_profileTypeDocument,
  Profiles_profileTypesDocument,
  Profiles_profilesDocument,
  Profiles_userDocument,
  UserLocale,
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
import { withError } from "@parallel/utils/promises/withError";
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
import { useSelection } from "@parallel/utils/useSelectionState";
import { ChangeEvent, MouseEvent, PropsWithChildren, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "DESC",
  }),
  type: string().list(),
  status: values(["OPEN", "CLOSED", "DELETION_SCHEDULED"]).orDefault("OPEN"),
};
type ProfilesQueryState = QueryStateFrom<typeof QUERY_STATE>;

interface ProfilesTableContext {
  status: ProfileStatus;
  setStatus: (status: ProfileStatus) => void;
}
function Profiles() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Profiles_userDocument);
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [status, setStatus] = useQueryStateSlice(queryState, setQueryState, "status");
  const navigate = useHandleNavigation();

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
        profileTypeId: queryState.type || undefined,
        status: [queryState.status],
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: _profileTypesData } = useQueryOrPreviousData(Profiles_profileTypesDocument, {
    variables: {
      offset: 0,
      limit: 100,
      locale: intl.locale as UserLocale,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: _profileTypeData } = useQueryOrPreviousData(Profiles_profileTypeDocument, {
    variables: {
      profileTypeId: queryState.type?.[0] ?? "",
    },
    fetchPolicy: "cache-first",
    skip:
      !queryState.type ||
      queryState.type.length > 1 ||
      _profileTypesData?.profileTypes.items.some((pt) => pt.id === queryState.type![0]),
  });

  const profiles = data?.profiles;
  const profileTypes = _profileTypesData?.profileTypes;

  const { selectedIds, selectedRows, onChangeSelectedIds } = useSelection(profiles?.items, "id");

  const columns = useProfileTableColumns(status);

  const showCreateProfileDialog = useCreateProfileDialog();
  const handleCreateProfile = async () => {
    try {
      const {
        hasValues,
        profile: { id },
      } = await showCreateProfileDialog({});
      if (hasValues) {
        navigate(`/app/profiles/${id}`);
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
          profileName: selectedRows[0].name,
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
    navigate(`/app/profiles/${row.id}`, event);
  }, []);

  const hasMultipleProfileTypes = isDefined(queryState.type) && queryState.type.length > 1;

  const profileType =
    queryState.type && queryState.type.length === 1
      ? profileTypes?.items.find((pt) => pt.id === queryState.type![0]) ??
        _profileTypeData?.profileType ??
        null
      : null;

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
        profileName: selectedRows[0].name,
      });
      refetch();
    } catch {}
  };

  const recoverProfile = useRecoverProfile();
  const handleRecoverClick = async () => {
    try {
      await recoverProfile({
        profileIds: selectedIds,
        profileName: selectedRows[0].name,
      });
      refetch();
    } catch {}
  };

  const closeProfile = useCloseProfile();
  const handleCloseClick = async () => {
    try {
      await closeProfile({
        profileIds: selectedIds,
        profileName: selectedRows[0].name,
      });
      refetch();
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

  return (
    <AppLayout
      title={intl.formatMessage({ id: "page.profiles.title", defaultMessage: "Profiles" })}
      me={me}
      realMe={realMe}
    >
      <Stack minHeight={0} paddingX={4} paddingTop={6} spacing={4}>
        <Flex alignItems="center">
          <Flex minWidth="0" width="fit-content">
            <Menu matchWidth>
              <MenuButton
                as={Button}
                size="lg"
                variant="outline"
                fontSize="2xl"
                paddingX={4}
                backgroundColor="white"
                data-action="change-profile-type"
                data-testid="profile-type-menu-button"
                rightIcon={<ChevronDownIcon boxSize={5} />}
              >
                {hasMultipleProfileTypes
                  ? intl.formatMessage({
                      id: "page.profiles.multiple-profile-types",
                      defaultMessage: "Multiple types",
                    })
                  : isDefined(profileType)
                    ? localizableUserTextRender({ intl, value: profileType.name, default: "" })
                    : intl.formatMessage({
                        id: "page.profiles.all-profiles",
                        defaultMessage: "All profiles",
                      })}
              </MenuButton>
              <Portal>
                <MenuList minWidth="180px" maxWidth="320px">
                  <MenuOptionGroup
                    value={
                      queryState.type
                        ? hasMultipleProfileTypes
                          ? "multiple"
                          : queryState.type?.[0]
                        : ""
                    }
                    onChange={(value) => {
                      setQueryState((s) => ({ ...s, type: value ? [value as string] : null }));
                    }}
                  >
                    <MenuItemOption value="" data-testid="profile-type-all">
                      <FormattedMessage
                        id="page.profiles.all-profiles"
                        defaultMessage="All profiles"
                      />
                    </MenuItemOption>
                    {profileTypes?.items.map((profileType) => {
                      return (
                        <MenuItemOption
                          key={profileType.id}
                          value={profileType.id}
                          data-testid={`profile-type-${profileType.id}`}
                        >
                          <Text noOfLines={2}>
                            <LocalizableUserTextRender
                              value={profileType.name}
                              default={intl.formatMessage({
                                id: "generic.unamed-profile-type",
                                defaultMessage: "Unnamed profile type",
                              })}
                            />
                          </Text>
                        </MenuItemOption>
                      );
                    })}
                  </MenuOptionGroup>
                </MenuList>
              </Portal>
            </Menu>
          </Flex>
          <Spacer minW={4} />
          <Box>
            <Button
              colorScheme="primary"
              onClick={handleCreateProfile}
              isDisabled={!userCanCreateProfiles}
            >
              <FormattedMessage id="page.profiles.create-profile" defaultMessage="Create profile" />
            </Button>
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
                  <Flex flex="1" alignItems="center" justifyContent="center">
                    <Text color="gray.300" fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-results"
                        defaultMessage="There's no profiles matching your criteria"
                      />
                    </Text>
                  </Flex>
                ) : queryState.status === "OPEN" ? (
                  <Flex flex="1" alignItems="center" justifyContent="center">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-profiles"
                        defaultMessage="You have no profiles yet. Start by creating one now!"
                      />
                    </Text>
                  </Flex>
                ) : queryState.status === "CLOSED" ? (
                  <Flex flex="1" alignItems="center" justifyContent="center">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-closed-profiles"
                        defaultMessage="There is no closed profile"
                      />
                    </Text>
                  </Flex>
                ) : queryState.status === "DELETION_SCHEDULED" ? (
                  <Flex flex="1" alignItems="center" justifyContent="center">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-deleted-profiles"
                        defaultMessage="No profile in the bin"
                      />
                    </Text>
                  </Flex>
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
  const showSubscribers = status === "OPEN";

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
            <OverflownText textStyle={row.name ? undefined : "hint"}>
              {row.name ||
                intl.formatMessage({
                  id: "generic.unnamed-profile",
                  defaultMessage: "Unnamed profile",
                })}
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
      ...(showSubscribers
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
    [intl.locale, showSubscribers],
  );
}

const _fragments = {
  get ProfileType() {
    return gql`
      fragment Profiles_ProfileType on ProfileType {
        id
        name
      }
    `;
  },
  get Profile() {
    return gql`
      fragment Profiles_Profile on Profile {
        id
        name
        status
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
    query Profiles_profileTypes($offset: Int, $limit: Int, $locale: UserLocale) {
      profileTypes(offset: $offset, limit: $limit, locale: $locale) {
        items {
          ...Profiles_ProfileType
        }
        totalCount
      }
    }
    ${_fragments.ProfileType}
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
  const [_, [error]] = await Promise.all([
    fetchQuery(Profiles_userDocument),
    withError(
      state.type && state.type.length === 1
        ? fetchQuery(Profiles_profileTypeDocument, { variables: { profileTypeId: state.type[0] } })
        : null,
    ),
  ]);
  if (error) {
    throw new RedirectError("/app/profiles");
  }
  return {};
};

export default compose(
  withDialogs,
  withPermission("PROFILES:LIST_PROFILES"),
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData,
)(Profiles);
