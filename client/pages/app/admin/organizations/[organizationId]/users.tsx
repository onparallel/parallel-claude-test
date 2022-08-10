import { gql, useMutation } from "@apollo/client";
import { Badge, Flex, Text, Tooltip, useToast } from "@chakra-ui/react";
import { ForbiddenIcon, LogInIcon } from "@parallel/chakra/icons";
import { AdminOrganizationsLayout } from "@parallel/components/admin-organizations/AdminOrganizationsLayout";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { useInviteUserDialog } from "@parallel/components/organization/dialogs/InviteUserDialog";
import { OrganizationMembersListTableHeader } from "@parallel/components/organization/OrganizationMembersListTableHeader";
import {
  AdminOrganizationsMembers_createOrganizationUserDocument,
  AdminOrganizationsMembers_organizationDocument,
  AdminOrganizationsMembers_OrganizationUserFragment,
  AdminOrganizationsMembers_queryDocument,
  OrganizationRole,
  OrganizationUsers_OrderBy,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { integer, sorting, string, useQueryState, values } from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useLoginAs } from "@parallel/utils/useLoginAs";
import { useOrganizationRoles } from "@parallel/utils/useOrganizationRoles";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const SORTING = ["fullName", "email", "createdAt", "lastActiveAt"] as const;

export const USERS_QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

type AdminOrganizationsMembersProps = UnwrapPromise<
  ReturnType<typeof AdminOrganizationsMembers.getInitialProps>
>;

function AdminOrganizationsMembers({ organizationId }: AdminOrganizationsMembersProps) {
  const {
    data: { me, realMe, ...rest },
  } = useAssertQuery(AdminOrganizationsMembers_queryDocument, {
    variables: { id: organizationId },
  });
  const organization = rest.organization!;

  const [state, setQueryState] = useQueryState(USERS_QUERY_STATE);
  const { data, loading, refetch } = useQueryOrPreviousData(
    AdminOrganizationsMembers_organizationDocument,
    {
      variables: {
        id: organizationId,
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        sortBy: [`${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy],
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const [search, setSearch] = useState(state.search);

  const users = data?.organization?.users;
  const { selectedRows, onChangeSelectedIds } = useSelection(users?.items, "id");

  const intl = useIntl();
  const toast = useToast();
  const genericError = useGenericErrorToast();
  const [createOrganizationUser] = useMutation(
    AdminOrganizationsMembers_createOrganizationUserDocument
  );
  const showInviteUserDialog = useInviteUserDialog();
  async function handleInviteUser() {
    try {
      const user = await showInviteUserDialog({});

      await createOrganizationUser({
        variables: {
          ...user,
          orgId: organization.id,
        },
        update: () => {
          refetch();
        },
      });

      toast({
        isClosable: true,
        duration: 5000,
        status: "success",
        title: intl.formatMessage({
          id: "organization.user-created-success.toast-title",
          defaultMessage: "User created successfully.",
        }),
        description: intl.formatMessage(
          {
            id: "organization.user-created-success.toast-description",
            defaultMessage:
              "We have sent an email to {email} with instructions to register in Parallel.",
          },
          {
            email: user.email,
          }
        ),
      });
    } catch (e: any) {
      if (e.message !== "CANCEL") {
        genericError();
      }
    }
  }

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
    await loginAs(selectedRows[0].id);
  };

  return (
    <AdminOrganizationsLayout tabKey="users" me={me} organization={organization} realMe={realMe}>
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isSelectable
          isHighlightable
          columns={columns}
          rows={users?.items}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={users?.totalCount}
          sort={state.sort}
          onSelectionChange={onChangeSelectedIds}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
          actions={[
            {
              key: "login-as",
              onClick: handleLoginAs,
              isDisabled:
                selectedRows.length !== 1 ||
                selectedRows[0].id === me.id ||
                selectedRows[0].status === "INACTIVE",
              leftIcon: <LogInIcon />,
              children: (
                <FormattedMessage id="organization-users.login-as" defaultMessage="Login as..." />
              ),
            },
          ]}
          header={
            <OrganizationMembersListTableHeader
              search={search}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onInviteClick={handleInviteUser}
              hasSsoProvider={organization.hasSsoProvider}
            />
          }
          body={
            users?.items.length === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="view.group.no-results"
                      defaultMessage="There's no users matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="view.group.no-users"
                      defaultMessage="No users added to this team yet"
                    />
                  </Text>
                </Flex>
              )
            ) : null
          }
        />
      </Flex>
    </AdminOrganizationsLayout>
  );
}

function useOrganizationMembersTableColumns() {
  const intl = useIntl();
  const roles = useOrganizationRoles();
  return useMemo<TableColumn<AdminOrganizationsMembers_OrganizationUserFragment>[]>(
    () => [
      {
        key: "id",
        header: intl.formatMessage({
          id: "organization-users.header.id",
          defaultMessage: "ID",
        }),
        cellProps: {
          width: "10%",
          minWidth: "140px",
        },
        CellContent: ({ row }) => {
          const copyToClipboard = useClipboardWithToast({
            text: intl.formatMessage({
              id: "organization-users.header.id.copied-toast",
              defaultMessage: "ID copied to clipboard",
            }),
          });
          return (
            <Text cursor="pointer" onClick={() => copyToClipboard({ value: row.id })}>
              {row.id}
            </Text>
          );
        },
      },
      {
        key: "fullName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
        },
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
        cellProps: {
          width: "30%",
          minWidth: "200px",
        },
        CellContent: ({ row }) => <>{row.email}</>,
      },
      {
        key: "role",
        header: intl.formatMessage({
          id: "organization-role.header.user",
          defaultMessage: "Role",
        }),
        cellProps: {
          width: "10%",
          minWidth: "130px",
        },
        CellContent: ({ row }) => (
          <Badge
            colorScheme={
              (
                {
                  OWNER: "primary",
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
        cellProps: {
          width: "10%",
          minWidth: "210px",
        },
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
          width: "10%",
          minWidth: "195px",
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

AdminOrganizationsMembers.fragments = {
  OrganizationUser: gql`
    fragment AdminOrganizationsMembers_OrganizationUser on User {
      id
      fullName
      email
      role
      createdAt
      lastActiveAt
      status
    }
  `,
  Organization: gql`
    fragment AdminOrganizationsMembers_Organization on Organization {
      id
      name
      hasSsoProvider
      ...AdminOrganizationsLayout_Organization
    }
    ${AdminOrganizationsLayout.fragments.Organization}
  `,
};

const _queries = [
  gql`
    query AdminOrganizationsMembers_query($id: GID!) {
      ...AdminOrganizationsLayout_Query
      organization(id: $id) {
        ...AdminOrganizationsMembers_Organization
      }
    }
    ${AdminOrganizationsLayout.fragments.Query}
    ${AdminOrganizationsMembers.fragments.Organization}
  `,
  gql`
    query AdminOrganizationsMembers_organization(
      $id: GID!
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [OrganizationUsers_OrderBy!]
    ) {
      organization(id: $id) {
        id
        users(
          offset: $offset
          limit: $limit
          search: $search
          sortBy: $sortBy
          includeInactive: true
        ) {
          totalCount
          items {
            ...AdminOrganizationsMembers_OrganizationUser
          }
        }
      }
    }
    ${AdminOrganizationsMembers.fragments.OrganizationUser}
  `,
];

const _mutations = [
  gql`
    mutation AdminOrganizationsMembers_createOrganizationUser(
      $firstName: String!
      $lastName: String!
      $email: String!
      $role: OrganizationRole!
      $locale: String
      $orgId: GID
    ) {
      createOrganizationUser(
        email: $email
        firstName: $firstName
        lastName: $lastName
        role: $role
        locale: $locale
        orgId: $orgId
      ) {
        ...AdminOrganizationsMembers_OrganizationUser
      }
    }
    ${AdminOrganizationsMembers.fragments.OrganizationUser}
  `,
];

AdminOrganizationsMembers.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await fetchQuery(AdminOrganizationsMembers_queryDocument, {
    variables: { id: query.organizationId as string },
  });
  return { organizationId: query.organizationId as string };
};

export default compose(
  withSuperAdminAccess,
  withDialogs,
  withApolloData
)(AdminOrganizationsMembers);
