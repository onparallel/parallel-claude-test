import { gql } from "@apollo/client";
import { Badge, Box, Stack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  AdminOrganizationsQuery,
  AdminOrganizationsUserQuery,
  AdminOrganizations_OrganizationFragment,
  OrganizationStatus,
  QueryOrganizations_OrderBy,
  useAdminOrganizationsQuery,
  useAdminOrganizationsUserQuery,
} from "@parallel/graphql/__types";
import {
  assertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import {
  enums,
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";

const PAGE_SIZE = 10;

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  status: enums<OrganizationStatus>(["DEV", "DEMO", "ACTIVE", "CHURNED"]),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

type OrganizationSelection = AdminOrganizations_OrganizationFragment;

function AdminOrganizations() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me },
  } = assertQuery(useAdminOrganizationsUserQuery());
  const {
    data: { organizations },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(
    useAdminOrganizationsQuery({
      variables: {
        offset: PAGE_SIZE * (state.page - 1),
        limit: PAGE_SIZE,
        search: state.search,
        status: state.status,
        sortBy: [
          `${state.sort.field}_${state.sort.direction}` as QueryOrganizations_OrderBy,
        ],
      },
    })
  );
  const sections = useAdminSections();

  const columns = useOrganizationColumns();
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
        id: "admin.organizations",
        defaultMessage: "Organizations",
      })}
      basePath="/app/admin"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="admin.title" defaultMessage="Admin panel" />
      }
      header={
        <FormattedMessage
          id="admin.organizations"
          defaultMessage="Organizations"
        />
      }
    >
      <Box flex="1" padding={4}>
        <TablePage
          columns={columns}
          rows={organizations.items}
          rowKeyProp={"id"}
          isHighlightable
          loading={loading}
          // onRowClick={handleRowClick}
          page={state.page}
          pageSize={PAGE_SIZE}
          totalCount={organizations.totalCount}
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

function useOrganizationColumns() {
  const intl = useIntl();
  return useMemo<TableColumn<OrganizationSelection>[]>(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
          id: "organizations.header.organization-name",
          defaultMessage: "Organization name",
        }),
        CellContent: ({ row }) => <>{row.name}</>,
      },
      {
        key: "identifier",
        header: intl.formatMessage({
          id: "organizations.header.identifier",
          defaultMessage: "Identifier",
        }),
        CellContent: ({ row }) => <>{row.identifier}</>,
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "organizations.header.status",
          defaultMessage: "Status",
        }),
        cellProps: {
          width: "1px",
          textAlign: "center",
        },
        CellContent: ({ row }) => (
          <Badge
            colorScheme={
              ({
                DEV: "gray",
                DEMO: "yellow",
                ACTIVE: "green",
                CHURNED: "red",
              } as Record<OrganizationStatus, string>)[row.status]
            }
          >
            {row.status}
          </Badge>
        ),
      },
      {
        key: "userCount",
        header: intl.formatMessage({
          id: "organizations.header.user-count",
          defaultMessage: "Users",
        }),
        cellProps: {
          width: "1px",
        },
        align: "right",
        CellContent: ({ row }) => <FormattedNumber value={row.userCount} />,
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
        CellContent: ({ row: { createdAt } }) => (
          <DateTime
            value={createdAt}
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

AdminOrganizations.fragments = {
  get Organization() {
    return gql`
      fragment AdminOrganizations_Organization on Organization {
        id
        name
        identifier
        status
        userCount
        createdAt
      }
    `;
  },
  get User() {
    return gql`
      fragment AdminOrganizations_User on User {
        ...AppLayout_User
      }
      ${AppLayout.fragments.User}
    `;
  },
};

AdminOrganizations.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const { page, search, status, sort } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    fetchQuery<AdminOrganizationsQuery>(
      gql`
        query AdminOrganizations(
          $offset: Int!
          $limit: Int!
          $search: String
          $sortBy: [QueryOrganizations_OrderBy!]
          $status: OrganizationStatus
        ) {
          organizations(
            offset: $offset
            limit: $limit
            search: $search
            sortBy: $sortBy
            status: $status
          ) {
            totalCount
            items {
              ...AdminOrganizations_Organization
            }
          }
        }
        ${AdminOrganizations.fragments.Organization}
      `,
      {
        variables: {
          offset: PAGE_SIZE * (page - 1),
          limit: PAGE_SIZE,
          search,
          sortBy: [
            `${sort.field}_${sort.direction}` as QueryOrganizations_OrderBy,
          ],
          status,
        },
      }
    ),
    fetchQuery<AdminOrganizationsUserQuery>(gql`
      query AdminOrganizationsUser {
        me {
          ...AdminOrganizations_User
        }
      }
      ${AdminOrganizations.fragments.User}
    `),
  ]);
};

export default compose(
  withSuperAdminAccess,
  withDialogs,
  withApolloData
)(AdminOrganizations);
