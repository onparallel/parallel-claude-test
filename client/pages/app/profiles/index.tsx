import { gql, useMutation } from "@apollo/client";
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
import { BellIcon, ChevronDownIcon, DeleteIcon, RepeatIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useCreateProfileDialog } from "@parallel/components/profiles/dialogs/CreateProfileDialog";
import { useProfileSubscribersDialog } from "@parallel/components/profiles/dialogs/ProfileSubscribersDialog";
import {
  Profiles_createProfileDocument,
  Profiles_ProfileFragment,
  Profiles_profilesDocument,
  Profiles_profileTypesDocument,
  Profiles_updateProfileFieldValueDocument,
  Profiles_userDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useDeleteProfile } from "@parallel/utils/mutations/useDeleteProfile";
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  integer,
  QueryStateFrom,
  QueryStateOf,
  SetQueryState,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useSelection } from "@parallel/utils/useSelectionState";
import { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
  profileType: string(),
};
type ProfilesQueryState = QueryStateFrom<typeof QUERY_STATE>;

function Profiles() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Profiles_userDocument);
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);

  const navigate = useHandleNavigation();

  const { data, loading, refetch } = useQueryOrPreviousData(Profiles_profilesDocument, {
    variables: {
      offset: queryState.items * (queryState.page - 1),
      limit: queryState.items,
      search: queryState.search,
      sortBy: [`${queryState.sort.field}_${queryState.sort.direction}` as const],
      filter: {
        profileTypeId: queryState.profileType ? [queryState.profileType] : undefined,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: _profileTypesData } = useQueryOrPreviousData(Profiles_profileTypesDocument, {
    variables: {
      offset: 0,
      limit: 999,
      locale: intl.locale as UserLocale,
    },
    fetchPolicy: "cache-and-network",
  });

  const profiles = data?.profiles;
  const profileTypes = _profileTypesData?.profileTypes;

  const { selectedIds, selectedRows, onChangeSelectedIds } = useSelection(profiles?.items, "id");

  const columns = useProfileTableColumns();

  const [createProfile] = useMutation(Profiles_createProfileDocument);
  const [updateProfileFieldValue] = useMutation(Profiles_updateProfileFieldValueDocument);
  const showCreateProfileDialog = useCreateProfileDialog();
  const handleCreateProfile = async () => {
    try {
      const { profileTypeId, fieldValues } = await showCreateProfileDialog();
      const { data } = await createProfile({
        variables: {
          profileTypeId,
        },
      });

      if (isDefined(data)) {
        await updateProfileFieldValue({
          variables: {
            profileId: data!.createProfile.id,
            fields: fieldValues,
          },
        });
        navigate(`/app/profiles/${data.createProfile.id}`);
      }
    } catch {}
  };

  const deleteProfile = useDeleteProfile();
  const handleDeleteClick = async () => {
    try {
      await deleteProfile({
        profileIds: selectedIds,
      });
      refetch();
    } catch {}
  };

  const handleRowClick = useCallback((row: Profiles_ProfileFragment, event: MouseEvent) => {
    navigate(`/app/profiles/${row.id}`, event);
  }, []);

  const context = useMemo(() => ({ user: me! }), [me]);

  const profileType = queryState.profileType
    ? profileTypes?.items.find((pt) => pt.id === queryState.profileType) ?? null
    : null;

  const showSubscribersDialog = useProfileSubscribersDialog();
  const handleSubscribeClick = useCallback(async () => {
    const isSubscribed = selectedRows.every((row) =>
      row.subscribers.some((s) => s.user.id === me!.id)
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

  const actions = useProfileListActions({
    onDeleteClick: handleDeleteClick,
    onSubscribeClick: handleSubscribeClick,
  });

  return (
    <AppLayout
      title={intl.formatMessage({ id: "page.profiles.title", defaultMessage: "Profiles" })}
      me={me}
      realMe={realMe}
    >
      <Stack minHeight={0} paddingX={4} paddingTop={6} spacing={4}>
        <Flex alignItems="center">
          <Box minWidth="0" width="fit-content">
            <Menu matchWidth>
              <MenuButton
                as={Button}
                size="lg"
                variant="ghost"
                fontSize="2xl"
                paddingX={3}
                data-action="change-profile-type"
                data-testid="profile-type-menu-button"
                rightIcon={<ChevronDownIcon boxSize={5} />}
              >
                {isDefined(profileType)
                  ? localizableUserTextRender({ intl, value: profileType.name, default: "" })
                  : intl.formatMessage({
                      id: "page.profiles.all-profile-types",
                      defaultMessage: "All profile types",
                    })}
              </MenuButton>
              <Portal>
                <MenuList minWidth="154px">
                  <MenuOptionGroup value={queryState.profileType ?? ""}>
                    <MenuItemOption
                      value=""
                      onClick={() => setQueryState((s) => ({ ...s, profileType: null }))}
                      data-testid="profile-type-all"
                    >
                      <FormattedMessage
                        id="page.profiles.all-profile-types"
                        defaultMessage="All profile types"
                      />
                    </MenuItemOption>
                    {profileTypes?.items.map((profileType) => {
                      return (
                        <MenuItemOption
                          key={profileType.id}
                          value={profileType.id}
                          onClick={() =>
                            setQueryState((s) => ({ ...s, profileType: profileType.id }))
                          }
                          data-testid={`profile-type-${profileType.id}`}
                        >
                          <LocalizableUserTextRender
                            value={profileType.name}
                            default={intl.formatMessage({
                              id: "generic.unamed-profile-type",
                              defaultMessage: "Unnamed profile type",
                            })}
                          />
                        </MenuItemOption>
                      );
                    })}
                  </MenuOptionGroup>
                </MenuList>
              </Portal>
            </Menu>
          </Box>
          <Spacer />
          <Button colorScheme="primary" onClick={handleCreateProfile}>
            <FormattedMessage id="page.profiles.create-profile" defaultMessage="Create profile" />
          </Button>
        </Flex>
        <Box flex="1" paddingBottom={16}>
          <TablePage
            flex="0 1 auto"
            minHeight={0}
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
                ) : (
                  <Flex flex="1" alignItems="center" justifyContent="center">
                    <Text fontSize="lg">
                      <FormattedMessage
                        id="page.profiles.no-profiles"
                        defaultMessage="You have no profiles yet. Start by creating one now!"
                      />
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

function useProfileListActions({
  onDeleteClick,
  onSubscribeClick,
}: {
  onDeleteClick: () => void;
  onSubscribeClick: () => void;
}) {
  return [
    {
      key: "subscribe",
      onClick: onSubscribeClick,
      leftIcon: <BellIcon />,
      children: <FormattedMessage id="generic.subscribe" defaultMessage="Subscribe" />,
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
    [onStateChange]
  );

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
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

function useProfileTableColumns(): TableColumn<Profiles_ProfileFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <Text as="span" textStyle={row.name ? undefined : "hint"}>
              {row.name ||
                intl.formatMessage({
                  id: "generic.unnamed-profile",
                  defaultMessage: "Unnamed profile",
                })}
            </Text>
          );
        },
      },
      {
        key: "type",
        header: intl.formatMessage({
          id: "component.profile-table-columns.type",
          defaultMessage: "Type",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({
          row: {
            profileType: { name },
          },
        }) => {
          return (
            <Text as="span">
              {localizableUserTextRender({
                value: name,
                intl,
                default: intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                }),
              })}
            </Text>
          );
        },
      },
      {
        key: "subscribed",
        header: intl.formatMessage({
          id: "component.profile-table-columns.subscribed",
          defaultMessage: "Subscribed",
        }),
        align: "left",
        cellProps: { width: "20%", minWidth: "132px" },
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
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          width: "20%",
          minWidth: "160px",
        },
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
        ),
      },
    ],
    [intl.locale]
  );
}

const _fragments = {
  get ProfileType() {
    return gql`
      fragment Profiles_ProfileType on ProfileType {
        id
        name
        createdAt
      }
    `;
  },
  get Profile() {
    return gql`
      fragment Profiles_Profile on Profile {
        id
        name
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
  get ProfileTypePagination() {
    return gql`
      fragment Profiles_ProfileTypePagination on ProfileTypePagination {
        items {
          ...Profiles_ProfileType
        }
        totalCount
      }
      ${this.ProfileType}
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
        ...Profiles_ProfileTypePagination
      }
    }
    ${_fragments.ProfileTypePagination}
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

const _mutations = [
  gql`
    mutation Profiles_createProfile($profileTypeId: GID!) {
      createProfile(profileTypeId: $profileTypeId) {
        ...Profiles_Profile
      }
    }
    ${_fragments.Profile}
  `,
  gql`
    mutation Profiles_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        ...Profiles_Profile
      }
    }
    ${_fragments.Profile}
  `,
];

Profiles.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Profiles_userDocument);
  return {};
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData
)(Profiles);
