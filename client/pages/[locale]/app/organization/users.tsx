import { gql } from "@apollo/client";
import { Badge, Flex, Text, Tooltip, useToast } from "@chakra-ui/react";
import { ForbiddenIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserSelectSelection } from "@parallel/components/common/UserSelect";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useConfirmActivateUsersDialog } from "@parallel/components/organization/ConfirmActivateUsersDialog";
import { useConfirmDeactivateUserDialog } from "@parallel/components/organization/ConfirmDeactivateUserDialog";
import { useCreateUserDialog } from "@parallel/components/organization/CreateUserDialog";
import { OrganizationUsersListTableHeader } from "@parallel/components/organization/OrganizationUsersListTableHeader";
import {
  OrganizationRole,
  OrganizationUsersQuery,
  OrganizationUsers_OrderBy,
  OrganizationUsers_UserFragment,
  useOrganizationUsersQuery,
  useOrganizationUsers_createOrganizationUserMutation,
  useOrganizationUsers_updateUserStatusMutation,
  UserStatus,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
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
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

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

function OrganizationUsers() {
  const intl = useIntl();
  const toast = useToast();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(
    useOrganizationUsersQuery({
      variables: {
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        sortBy: [
          `${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy,
        ],
      },
    })
  );

  const userList = me.organization.users;

  const [selected, setSelected] = useState<string[]>([]);

  const selectedUsers = useMemo(
    () =>
      selected
        .map((userId) => userList.items.find((u) => u.id === userId)!)
        .filter((u) => u !== undefined),
    [selected.join(","), userList.items]
  );

  const [search, setSearch] = useState(state.search);

  const sections = useOrganizationSections();

  const columns = useOrganizationUsersTableColumns();

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

  const [
    createOrganizationUser,
  ] = useOrganizationUsers_createOrganizationUserMutation();
  const showCreateUserDialog = useCreateUserDialog();
  const handleCreateUser = async () => {
    try {
      const newUser = await showCreateUserDialog({});
      await createOrganizationUser({
        variables: newUser,
        update: () => {
          refetch();
        },
      });
      toast({
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
          { email: newUser.email }
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {}
  };

  const showConfirmActivateUserDialog = useConfirmActivateUsersDialog();
  const showConfirmDeactivateUserDialog = useConfirmDeactivateUserDialog();
  const [updateUserStatus] = useOrganizationUsers_updateUserStatusMutation();
  const handleUpdateUserStatus = async (
    userIds: string[],
    newStatus: UserStatus
  ) => {
    try {
      let transferToUser: Maybe<UserSelectSelection> = null;
      if (newStatus === "ACTIVE") {
        await showConfirmActivateUserDialog({ count: userIds.length });
      } else if (newStatus === "INACTIVE") {
        transferToUser = await showConfirmDeactivateUserDialog({
          selected: userIds,
          me,
        });
      }
      await updateUserStatus({
        variables: {
          newStatus,
          userIds,
          transferToUserId: transferToUser?.id,
        },
      });
      toast({
        title: intl.formatMessage({
          id: "generic.success",
          defaultMessage: "Success",
        }),
        description: intl.formatMessage({
          id: "organization.user-updated-success.toast-title",
          defaultMessage: "User updated successfully.",
        }),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {}
  };

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
      <Flex flexDirection="1" flex="1" padding={4}>
        <TablePage
          flex="1"
          isSelectable
          isHighlightable
          columns={columns}
          rows={userList.items}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={userList.totalCount}
          sort={state.sort}
          onSelectionChange={setSelected}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <OrganizationUsersListTableHeader
              me={me}
              search={search}
              selectedUsers={selectedUsers}
              onCreateUser={handleCreateUser}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onUpdateUserStatus={handleUpdateUserStatus}
            />
          }
        />
      </Flex>
    </SettingsLayout>
  );
}

function useOrganizationUsersTableColumns(): TableColumn<OrganizationUsers_UserFragment>[] {
  const intl = useIntl();
  return useMemo(
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
            <Text
              as="span"
              display="inline-flex"
              whiteSpace="nowrap"
              alignItems="center"
            >
              <Text
                as="span"
                textDecoration={
                  row.status === "INACTIVE" ? "line-through" : "none"
                }
              >
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
            {row.role === "ADMIN" ? (
              <FormattedMessage
                id="organization-users.admin-role"
                defaultMessage="Admin"
              />
            ) : (
              <FormattedMessage
                id="organization-users.normal-role"
                defaultMessage="Normal"
              />
            )}
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
              <FormattedMessage
                id="generic.never-active"
                defaultMessage="Never active"
              />
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

OrganizationUsers.fragments = {
  get User() {
    return gql`
      fragment OrganizationUsers_User on User {
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
};

OrganizationUsers.mutations = [
  gql`
    mutation OrganizationUsers_createOrganizationUser(
      $firstName: String!
      $lastName: String!
      $email: String!
      $role: OrganizationRole!
    ) {
      createOrganizationUser(
        email: $email
        firstName: $firstName
        lastName: $lastName
        role: $role
      ) {
        ...OrganizationUsers_User
      }
    }
    ${OrganizationUsers.fragments.User}
  `,
  gql`
    mutation OrganizationUsers_updateUserStatus(
      $userIds: [GID!]!
      $newStatus: UserStatus!
      $transferToUserId: GID
    ) {
      updateUserStatus(
        userIds: $userIds
        status: $newStatus
        transferToUserId: $transferToUserId
      ) {
        id
        status
      }
    }
  `,
];

OrganizationUsers.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  const { page, items, search, sort } = parseQuery(context.query, QUERY_STATE);
  await fetchQuery<OrganizationUsersQuery>(
    gql`
      query OrganizationUsers(
        $offset: Int!
        $limit: Int!
        $search: String
        $sortBy: [OrganizationUsers_OrderBy!]
      ) {
        me {
          organization {
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
                ...OrganizationUsers_User
              }
            }
          }
          ...SettingsLayout_User
        }
      }
      ${SettingsLayout.fragments.User}
      ${OrganizationUsers.fragments.User}
    `,
    {
      variables: {
        offset: items * (page - 1),
        limit: items,
        search,
        sortBy: [
          `${sort.field}_${sort.direction}` as OrganizationUsers_OrderBy,
        ],
      },
    }
  );
};

export default compose(
  withAdminOrganizationRole,
  withDialogs,
  withApolloData
)(OrganizationUsers);
