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
import { ChevronDownIcon, RepeatIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { Profiles_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
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
import { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useSelection } from "@parallel/utils/useSelectionState";
import { TableColumn } from "@parallel/components/common/Table";
import { DateTime } from "@parallel/components/common/DateTime";
import { FORMATS } from "@parallel/utils/dates";
import { useCreateProfileDialog } from "@parallel/components/profiles/dialogs/CreateProfileDialog";
import { useHandleNavigation } from "@parallel/utils/navigation";

const SORTING = ["name", "type", "createdAt"] as const;

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
  const {
    data: { me, realMe },
  } = useAssertQuery(Profiles_userDocument);
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);

  const loading = false;

  const { onChangeSelectedIds } = useSelection([{}] as any[], "id");

  const columns = useProfileTableColumns();

  const [profileType, setProfileType] = useState<string>("All the profiles");

  const profileTypes = [
    { id: "1231", name: "Some other profile" },
    { id: "wda1231", name: "Contracts" },
  ];

  const showCreateProfileDialog = useCreateProfileDialog();
  const handleCreateProfile = async () => {
    try {
      const data = await showCreateProfileDialog();
      console.log("new profile data: ", data);
    } catch {}
  };

  const navigate = useHandleNavigation();
  const handleRowClick = useCallback((row: any, event: MouseEvent) => {
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
                    {profileTypes.map(({ id, name }) => {
                      return (
                        <MenuItemOption
                          key={id}
                          value={name}
                          onClick={() => setProfileType(name)}
                          data-testid={`profile-type-${name}`}
                        >
                          {name}
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
            rows={[] as any[]}
            rowKeyProp="id"
            context={context}
            isSelectable
            isHighlightable
            loading={loading}
            onRowClick={handleRowClick}
            page={queryState.page}
            pageSize={queryState.items}
            totalCount={300}
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
                onReload={() => {}}
              />
            }
            body={
              !loading ? (
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

function useProfileTableColumns(): TableColumn<any>[] {
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
        CellContent: ({ row }) => {
          return <Text as="span">{row.type}</Text>;
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

const _queries = [
  gql`
    query Profiles_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
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
