import { gql } from "@apollo/client";
import { Badge, Flex, Heading, Text, Tooltip } from "@chakra-ui/react";
import { ForbiddenIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { OrganizationMembersListTableHeader } from "@parallel/components/organization/OrganizationMembersListTableHeader";
import {
  OrganizationMembers_organizationDocument,
  OrganizationMembers_OrganizationUserFragment,
  OrganizationMembers_userDocument,
  OrganizationRole,
  OrganizationUsers_OrderBy,
} from "@parallel/graphql/__types";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useLoginAs } from "@parallel/utils/useLoginAs";
import { useOrganizationRoles } from "@parallel/utils/useOrganizationRoles";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

const SORTING = ["fullName", "email", "createdAt", "lastActiveAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

type OrganizationMembersProps = UnwrapPromise<
  ReturnType<typeof OrganizationMembers.getInitialProps>
>;

function OrganizationMembers({ organizationId }: OrganizationMembersProps) {
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [search, setSearch] = useState(state.search);
  const [selected, setSelected] = useState<string[]>([]);
  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationMembers_userDocument);

  const { data, loading, refetch } = useAssertQueryOrPreviousData(
    OrganizationMembers_organizationDocument,
    {
      variables: {
        id: organizationId,
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        sortBy: [`${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy],
      },
    }
  );
  const organization = data.organization!;
  const users = organization.users.items;

  const selectedUsers = useMemo(
    () => selected.map((userId) => users.find((u) => u.id === userId)).filter(isDefined),
    [selected.join(","), users]
  );

  const sections = useAdminSections();
  const columns = useOrganizationMembersTableColumns();
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
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );

  const loginAs = useLoginAs();
  const handleLoginAs = async () => {
    await loginAs(selected[0]);
  };

  return (
    <SettingsLayout
      title={organization?.name ?? ""}
      basePath="/app/admin/organizations"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="admin.title" defaultMessage="Admin panel" />}
      header={
        <Heading as="h3" size="md">
          {organization?.name ?? ""}
        </Heading>
      }
      showBackButton={true}
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isSelectable
          isHighlightable
          columns={columns}
          rows={users ?? []}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={organization?.users.totalCount ?? 0}
          sort={state.sort}
          onSelectionChange={setSelected}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <OrganizationMembersListTableHeader
              search={search}
              selectedUsers={selectedUsers}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onLoginAs={handleLoginAs}
            />
          }
          body={
            users.length === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="view.group.no-results"
                      defaultMessage="There's no members matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="view.group.no-members"
                      defaultMessage="No members added to this team yet"
                    />
                  </Text>
                </Flex>
              )
            ) : null
          }
        />
      </Flex>
    </SettingsLayout>
  );
}

function useOrganizationMembersTableColumns() {
  const intl = useIntl();
  const roles = useOrganizationRoles();
  return useMemo<TableColumn<OrganizationMembers_OrganizationUserFragment>[]>(
    () => [
      {
        key: "fullName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return (
            <Text as="span" display="inline-flex" whiteSpace="nowrap" alignItems="center">
              <Text as="span" textDecoration={row.status === "INACTIVE" ? "line-through" : "none"}>
                {row.fullName}
              </Text>
              {row.status === "INACTIVE" ? (
                <Tooltip
                  label={intl.formatMessage({
                    id: "organization-users.header.inactive-user",
                    defaultMessage: "Inactive user",
                  })}
                >
                  <ForbiddenIcon
                    marginLeft={2}
                    color="red.300"
                    aria-label={intl.formatMessage({
                      id: "organization-users.header.inactive-user",
                      defaultMessage: "Inactive user",
                    })}
                  />
                </Tooltip>
              ) : null}
            </Text>
          );
        },
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
          id: "organization-role.header.user",
          defaultMessage: "Role",
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
                  OWNER: "purple",
                  ADMIN: "green",
                } as Record<OrganizationRole, string>
              )[row.role] ?? "gray"
            }
          >
            {roles.find((r) => r.role === row.role)?.label ?? (null as never)}
          </Badge>
        ),
      },
      {
        key: "lastActiveAt",
        header: intl.formatMessage({
          id: "generic.last-active-at",
          defaultMessage: "Last active at",
        }),
        isSortable: true,
        CellContent: ({ row }) =>
          row.lastActiveAt ? (
            <DateTime
              value={row.lastActiveAt}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ) : (
            <Text textStyle="hint">
              <FormattedMessage id="generic.never-active" defaultMessage="Never active" />
            </Text>
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

OrganizationMembers.fragments = {
  get OrganizationUser() {
    return gql`
      fragment OrganizationMembers_OrganizationUser on User {
        id
        fullName
        email
        role
        createdAt
        lastActiveAt
        status
      }
    `;
  },
  get Organization() {
    return gql`
      fragment OrganizationMembers_Organization on Organization {
        id
        name
      }
    `;
  },
};

const _queries = [
  gql`
    query OrganizationMembers_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
  gql`
    query OrganizationMembers_organization(
      $id: GID!
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [OrganizationUsers_OrderBy!]
    ) {
      organization(id: $id) {
        ...OrganizationMembers_Organization
        users(
          offset: $offset
          limit: $limit
          search: $search
          sortBy: $sortBy
          includeInactive: true
        ) {
          totalCount
          items {
            ...OrganizationMembers_OrganizationUser
          }
        }
      }
    }
    ${OrganizationMembers.fragments.OrganizationUser}
    ${OrganizationMembers.fragments.Organization}
  `,
];

OrganizationMembers.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const { page, items, search, sort } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    fetchQuery(OrganizationMembers_organizationDocument, {
      variables: {
        id: query!.organizationId as string,
        offset: items * (page - 1),
        limit: items,
        search,
        sortBy: [`${sort.field}_${sort.direction}` as OrganizationUsers_OrderBy],
      },
    }),
    fetchQuery(OrganizationMembers_userDocument),
  ]);
  return { organizationId: query.organizationId as string };
};

export default compose(withSuperAdminAccess, withDialogs, withApolloData)(OrganizationMembers);
