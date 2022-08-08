import { gql } from "@apollo/client";
import { Badge, Box, Flex, Heading, Stack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  AdminOrganizations_OrganizationFragment,
  AdminOrganizations_organizationsDocument,
  AdminOrganizations_userDocument,
  OrganizationStatus,
  QueryOrganizations_OrderBy,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { integer, sorting, string, useQueryState, values } from "@parallel/utils/queryState";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  status: values<OrganizationStatus>(["DEV", "DEMO", "ACTIVE", "CHURNED"]),
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
    data: { me, realMe },
  } = useAssertQuery(AdminOrganizations_userDocument);
  const { data, loading, refetch } = useQueryOrPreviousData(
    AdminOrganizations_organizationsDocument,
    {
      variables: {
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        status: state.status,
        sortBy: [`${state.sort.field}_${state.sort.direction}` as QueryOrganizations_OrderBy],
      },
    }
  );
  const organizations = data?.organizations;

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

  const navigate = useHandleNavigation();
  const handleRowClick = useCallback(function (row: OrganizationSelection, event: MouseEvent) {
    navigate(`/app/admin/organizations/${row.id}`, event);
  }, []);

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "admin.organizations",
        defaultMessage: "Organizations",
      })}
      basePath="/app/admin"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="admin.title" defaultMessage="Admin panel" />}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="admin.organizations" defaultMessage="Organizations" />
        </Heading>
      }
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          columns={columns}
          rows={organizations?.items}
          onRowClick={handleRowClick}
          rowKeyProp={"id"}
          isHighlightable
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={organizations?.totalCount}
          sort={state.sort}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <Stack direction="row" padding={2}>
              <Box flex="0 1 400px">
                <SearchInput value={search ?? ""} onChange={handleSearchChange} />
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
      </Flex>
    </SettingsLayout>
  );
}

function useOrganizationColumns() {
  const intl = useIntl();
  return useMemo<TableColumn<OrganizationSelection>[]>(
    () => [
      {
        key: "_id",
        header: "ID",
        CellContent: ({ row }) => <>{row._id}</>,
      },
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
              (
                {
                  DEV: "gray",
                  DEMO: "yellow",
                  ACTIVE: "green",
                  CHURNED: "red",
                } as Record<OrganizationStatus, string>
              )[row.status]
            }
          >
            {row.status}
          </Badge>
        ),
      },
      {
        key: "activeUserCount",
        header: intl.formatMessage({
          id: "organizations.header.user-count",
          defaultMessage: "Users",
        }),
        cellProps: {
          width: "1px",
        },
        align: "right",
        CellContent: ({ row }) => (
          <>
            <FormattedNumber value={row.activeUserCount} />/
            <FormattedNumber value={row.usageLimits.users.limit} />
          </>
        ),
      },
      {
        key: "petitionsUsage",
        header: intl.formatMessage({
          id: "organizations.header.parallels-used",
          defaultMessage: "Parallels used",
        }),
        cellProps: {
          width: "1px",
        },
        align: "right",
        CellContent: ({ row }) => (
          <>
            <FormattedNumber value={row.usageLimits.petitions.used} />/
            <FormattedNumber value={row.usageLimits.petitions.limit} />
          </>
        ),
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
          <DateTime value={createdAt} format={FORMATS.LLL} useRelativeTime whiteSpace="nowrap" />
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
        _id
        name
        status
        activeUserCount
        createdAt
        usageLimits {
          users {
            limit
          }
          petitions {
            used
            limit
          }
        }
      }
    `;
  },
};

AdminOrganizations.queries = [
  gql`
    query AdminOrganizations_organizations(
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
  gql`
    query AdminOrganizations_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

AdminOrganizations.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(AdminOrganizations_userDocument);
};

export default compose(withSuperAdminAccess, withDialogs, withApolloData)(AdminOrganizations);
