import { gql } from "@apollo/client";
import { Badge, Box, Stack } from "@chakra-ui/core";
import { RepeatIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import {
  redirect,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  OrganizationUsersQuery,
  OrganizationUsers_UserFragment,
  useOrganizationUsersQuery,
  OrganizationRole,
  OrganizationUsers_OrderBy,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { FORMATS } from "@parallel/utils/dates";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const PAGE_SIZE = 10;

const SORTING = ["firstName", "lastName", "email", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

type UserSelection = OrganizationUsers_UserFragment;

function OrganizationUsers() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(
    useOrganizationUsersQuery({
      variables: {
        offset: PAGE_SIZE * (state.page - 1),
        limit: PAGE_SIZE,
        search: state.search,
        sortBy: [
          `${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy,
        ],
      },
    })
  );

  const userList = me.organization.users;

  const sections = useOrganizationSections();

  const columns = useOrganizationUsersColumns();
  const [search, setSearch] = useState(state.search);

  const debouncedOnSearchChange = useDebouncedCallback(
    (value) => {
      setQueryState((current) => ({
        ...current,
        search: value,
        page: 1,
      }));
    },
    300,
    [setQueryState]
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
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.users.title",
        defaultMessage: "Users",
      })}
      basePath="/app/organization"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage
          id="organization.title"
          defaultMessage="Organization"
        />
      }
      header={
        <FormattedMessage
          id="organization.users.title"
          defaultMessage="Users"
        />
      }
    >
      <Box flex="1" padding={4}>
        <TablePage
          columns={columns}
          rows={userList.items}
          rowKeyProp={"id"}
          isHighlightable
          loading={loading}
          page={state.page}
          pageSize={PAGE_SIZE}
          totalCount={userList.totalCount}
          sort={state.sort}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <Stack direction="row" padding={2}>
              <Box flex="0 1 400px">
                <SearchInput
                  value={search ?? ""}
                  onChange={handleSearchChange}
                />
              </Box>
              <IconButtonWithTooltip
                onClick={() => refetch()}
                icon={<RepeatIcon />}
                placement="bottom"
                variant="outline"
                label={intl.formatMessage({
                  id: "generic.reload-data",
                  defaultMessage: "Reload",
                })}
              />
            </Stack>
          }
        />
      </Box>
    </SettingsLayout>
  );
}

function useOrganizationUsersColumns() {
  const intl = useIntl();
  return useMemo<TableColumn<UserSelection>[]>(
    () => [
      {
        key: "firstName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.user-firstname",
          defaultMessage: "First name",
        }),
        CellContent: ({ row }) => <>{row.firstName}</>,
      },
      {
        key: "lastName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.user-lastname",
          defaultMessage: "Last name",
        }),
        CellContent: ({ row }) => <>{row.lastName}</>,
      },
      {
        key: "email",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.user-email",
          defaultMessage: "Email",
        }),
        CellContent: ({ row }) => <>{row.email}</>,
      },
      {
        key: "role",
        header: intl.formatMessage({
          id: "organization-users.header.user-role",
          defaultMessage: "Role",
        }),
        cellProps: {
          width: "1px",
          textAlign: "center",
        },
        CellContent: ({ row }) => (
          <Badge
            colorScheme={
              ({
                ADMIN: "green",
                NORMAL: "gray",
              } as Record<OrganizationRole, string>)[row.role]
            }
          >
            {row.role}
          </Badge>
        ),
      },
      {
        key: "lastActiveAt",
        header: intl.formatMessage({
          id: "generic.last-active-at",
          defaultMessage: "Last active at",
        }),
        CellContent: ({ row }) =>
          row.lastActiveAt ? (
            <DateTime
              value={row.lastActiveAt}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ) : null,
      },
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          width: "1px",
        },
        CellContent: ({ row }) => (
          <DateTime
            value={row.createdAt}
            format={FORMATS.LLL}
            useRelativeTime
            whiteSpace="nowrap"
          />
        ),
      },
    ],
    [intl.locale]
  );
}

OrganizationUsers.fragments = {
  get User() {
    return gql`
      fragment OrganizationUsers_User on User {
        id
        firstName
        lastName
        email
        role
        createdAt
        lastActiveAt
      }
    `;
  },
};

OrganizationUsers.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  const { page, search, sort } = parseQuery(context.query, QUERY_STATE);
  const { data } = await fetchQuery<OrganizationUsersQuery>(
    gql`
      query OrganizationUsers(
        $offset: Int!
        $limit: Int!
        $search: String
        $sortBy: [OrganizationUsers_OrderBy!]
      ) {
        me {
          ...AppLayout_User
          organization {
            users(
              offset: $offset
              limit: $limit
              search: $search
              sortBy: $sortBy
            ) {
              totalCount
              items {
                ...OrganizationUsers_User
              }
            }
          }
        }
      }
      ${AppLayout.fragments.User}
      ${OrganizationUsers.fragments.User}
    `,
    {
      variables: {
        offset: PAGE_SIZE * (page - 1),
        limit: PAGE_SIZE,
        search,
        sortBy: [
          `${sort.field}_${sort.direction}` as OrganizationUsers_OrderBy,
        ],
      },
    }
  );

  if (data.me.role !== "ADMIN") {
    return redirect(context, `/${context.query.locale}/app`);
  }
};

export default withApolloData(OrganizationUsers);
