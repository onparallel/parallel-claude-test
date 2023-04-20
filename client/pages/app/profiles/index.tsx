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
import { ChevronDownIcon, RepeatIcon } from "@parallel/chakra/icons";
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
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useCreateProfileDialog } from "@parallel/components/profiles/dialogs/CreateProfileDialog";
import {
  Profiles_createProfileDocument,
  Profiles_ProfileFragment,
  Profiles_profilesDocument,
  Profiles_profileTypesDocument,
  Profiles_userDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
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

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};
type ProfilesQueryState = QueryStateFrom<typeof QUERY_STATE>;

function Profiles() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Profiles_userDocument);
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);

  const { data, loading, refetch } = useQueryOrPreviousData(Profiles_profilesDocument, {
    variables: {
      offset: queryState.items * (queryState.page - 1),
      limit: queryState.items,
      search: queryState.search,
      sortBy: [`${queryState.sort.field}_${queryState.sort.direction}` as const],
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

  const { onChangeSelectedIds } = useSelection(profiles?.items, "id");

  const columns = useProfileTableColumns();

  const [profileType, setProfileType] = useState<string>("All the profiles");

  const [createProfile] = useMutation(Profiles_createProfileDocument);
  const showCreateProfileDialog = useCreateProfileDialog();
  const handleCreateProfile = async () => {
    try {
      const { profileTypeId } = await showCreateProfileDialog();
      // console.log("new profile data: ", data);
      await createProfile({
        variables: {
          profileTypeId,
        },
      });
      refetch();
    } catch {}
  };

  const navigate = useHandleNavigation();
  const handleRowClick = useCallback((row: Profiles_ProfileFragment, event: MouseEvent) => {
    navigate(`/app/profiles/${row.id}`, event);
  }, []);

  const context = useMemo(() => ({ user: me! }), [me]);

  return (
    <AppLayout title={"Profiles"} me={me} realMe={realMe}>
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
                {profileType}
              </MenuButton>
              <Portal>
                <MenuList minWidth="154px">
                  <MenuOptionGroup value={profileType}>
                    <MenuItemOption
                      value={"All the profiles"}
                      onClick={() => setProfileType("All the profiles")}
                      data-testid="profile-type-all"
                    >
                      {"All the profiles"}
                    </MenuItemOption>
                    {profileTypes?.items.map(({ id, name }) => {
                      return (
                        <MenuItemOption
                          key={id}
                          value={id}
                          onClick={() => setProfileType(id)}
                          data-testid={`profile-type-${id}`}
                        >
                          <LocalizableUserTextRender
                            value={name}
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
          width: "43%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return <Text as="span">{row.name}</Text>;
        },
      },
      {
        key: "type",
        isSortable: true,
        header: intl.formatMessage({
          id: "component.profile-table-columns.type",
          defaultMessage: "Type",
        }),
        cellProps: {
          width: "42%",
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
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
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
        createdAt
      }
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
    }
    ${AppLayout.fragments.Query}
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
    ) {
      profiles(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
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
