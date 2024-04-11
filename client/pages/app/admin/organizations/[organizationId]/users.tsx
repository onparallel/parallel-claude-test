import { gql, useMutation } from "@apollo/client";
import { Badge, Flex, Text, Tooltip, useToast } from "@chakra-ui/react";
import { ForbiddenIcon, LogInIcon } from "@parallel/chakra/icons";
import { AdminOrganizationMembersListTableHeader } from "@parallel/components/admin-organizations/AdminOrganizationMembersListTableHeader";
import { AdminOrganizationsLayout } from "@parallel/components/admin-organizations/AdminOrganizationsLayout";
import { useInviteUserDialog } from "@parallel/components/admin-organizations/dialogs/InviteUserDialog";
import { DateTime } from "@parallel/components/common/DateTime";
import { isDialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import {
  AdminOrganizationsMembers_inviteUserToOrganizationDocument,
  AdminOrganizationsMembers_organizationDocument,
  AdminOrganizationsMembers_OrganizationUserFragment,
  AdminOrganizationsMembers_queryDocument,
  OrganizationUsers_OrderBy,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { integer, sorting, string, useQueryState, values } from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useLoginAs } from "@parallel/utils/useLoginAs";
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
    },
  );

  const [search, setSearch] = useState(state.search);

  const users = data?.organization?.users;
  const { selectedRows, onChangeSelectedIds } = useSelection(users?.items, "id");

  const intl = useIntl();
  const toast = useToast();
  const showGenericErrorToast = useGenericErrorToast();
  const [inviteUserToOrganization] = useMutation(
    AdminOrganizationsMembers_inviteUserToOrganizationDocument,
  );
  const showInviteUserDialog = useInviteUserDialog();
  async function handleInviteUser() {
    try {
      const user = await showInviteUserDialog();

      await inviteUserToOrganization({
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
          id: "page.users.user-created-success-toast-title",
          defaultMessage: "User created successfully.",
        }),
        description: intl.formatMessage(
          {
            id: "page.users.user-created-success-toast-description",
            defaultMessage:
              "We have sent an email to {email} with instructions to register in Parallel.",
          },
          {
            email: user.email,
          },
        ),
      });
    } catch (error) {
      if (isDialogError(error)) {
        return;
      } else if (isApolloError(error, "USER_ALREADY_IN_ORG_ERROR")) {
        toast({
          status: "info",
          title: intl.formatMessage({
            id: "page.users.user-already-registered-toast-title",
            defaultMessage: "User already registered",
          }),
          description: intl.formatMessage({
            id: "page.users.user-already-registered-toast-description",
            defaultMessage: "The provided email is already registered on the organization.",
          }),
          isClosable: true,
        });
      } else if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
        const code = (error as any).graphQLErrors[0]?.extensions?.extra?.error_code;
        if (code === "INVALID_MX_EMAIL_ERROR" || code === "INVALID_EMAIL_ERROR") {
          toast({
            status: "error",
            title: intl.formatMessage({
              id: "page.admin-organization-users.invalid-email-toast-title",
              defaultMessage: "Invalid email",
            }),
            description: intl.formatMessage({
              id: "page.admin-organization-users.invalid-email-toast-description",
              defaultMessage: "The provided email is invalid.",
            }),
          });
        } else {
          showGenericErrorToast(error);
        }
      } else {
        showGenericErrorToast(error);
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
    [setQueryState],
  );

  const handleSearchChange = useCallback(
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange],
  );

  const loginAs = useLoginAs();
  const handleLoginAs = async () => {
    await loginAs(selectedRows[0].id);
  };

  return (
    <AdminOrganizationsLayout
      currentTabKey="users"
      me={me}
      organization={organization}
      realMe={realMe}
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={24}>
        <TablePage
          flex="0 1 auto"
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
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
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
              children: <FormattedMessage id="page.users.login-as" defaultMessage="Login as..." />,
            },
          ]}
          header={
            <AdminOrganizationMembersListTableHeader
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
                      id="page.group.no-results"
                      defaultMessage="There's no users matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="page.group.no-users"
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
  return useMemo<TableColumn<AdminOrganizationsMembers_OrganizationUserFragment>[]>(
    () => [
      {
        key: "id",
        label: intl.formatMessage({
          id: "organization-users.header.id",
          defaultMessage: "ID",
        }),
        cellProps: {
          width: "1px",
        },
        CellContent: ({ row }) => {
          return <>{row.id}</>;
        },
      },
      {
        key: "fullName",
        isSortable: true,
        label: intl.formatMessage({
          id: "page.users.table-name-label",
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
                    id: "page.users.inactive-user",
                    defaultMessage: "Inactive user",
                  })}
                >
                  <ForbiddenIcon
                    marginStart={2}
                    color="red.300"
                    aria-label={intl.formatMessage({
                      id: "page.users.inactive-user",
                      defaultMessage: "Inactive user",
                    })}
                  />
                </Tooltip>
              ) : null}
              {row.isOrgOwner ? (
                <Badge marginStart={2} colorScheme="primary" position="relative" top="1.5px">
                  <FormattedMessage id="generic.organization-owner" defaultMessage="Owner" />
                </Badge>
              ) : null}
            </Text>
          );
        },
      },
      {
        key: "email",
        isSortable: true,
        label: intl.formatMessage({
          id: "page.users.table-user-email-label",
          defaultMessage: "Email",
        }),
        CellContent: ({ row }) => <>{row.email}</>,
      },
      {
        key: "lastActiveAt",
        label: intl.formatMessage({
          id: "generic.last-active-at",
          defaultMessage: "Last active at",
        }),
        isSortable: true,
        cellProps: {
          minWidth: "220px",
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
        label: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          minWidth: "220px",
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
    [intl.locale],
  );
}

AdminOrganizationsMembers.fragments = {
  OrganizationUser: gql`
    fragment AdminOrganizationsMembers_OrganizationUser on User {
      id
      fullName
      email
      createdAt
      lastActiveAt
      status
      isOrgOwner
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
        users(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
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
    mutation AdminOrganizationsMembers_inviteUserToOrganization(
      $firstName: String!
      $lastName: String!
      $email: String!
      $locale: UserLocale!
      $orgId: GID
    ) {
      inviteUserToOrganization(
        email: $email
        firstName: $firstName
        lastName: $lastName
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
  withApolloData,
)(AdminOrganizationsMembers);
