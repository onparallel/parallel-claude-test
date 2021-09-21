import { gql } from "@apollo/client";
import { Badge, Flex, Heading, Text, Tooltip, useToast } from "@chakra-ui/react";
import { ForbiddenIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserSelectSelection } from "@parallel/components/common/UserSelect";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useConfirmActivateUsersDialog } from "@parallel/components/organization/ConfirmActivateUsersDialog";
import { useConfirmDeactivateUserDialog } from "@parallel/components/organization/ConfirmDeactivateUserDialog";
import { useCreateOrUpdateUserDialog } from "@parallel/components/organization/CreateOrUpdateUserDialog";
import { OrganizationUsersListTableHeader } from "@parallel/components/organization/OrganizationUsersListTableHeader";
import { UserLimitReachedAlert } from "@parallel/components/organization/UserLimitReachedAlert";
import {
  OrganizationRole,
  OrganizationUsersQuery,
  OrganizationUsers_OrderBy,
  OrganizationUsers_UserFragment,
  useOrganizationUsersQuery,
  useOrganizationUsers_createOrganizationUserMutation,
  useOrganizationUsers_updateOrganizationUserMutation,
  useOrganizationUsers_updateUserStatusMutation,
  User,
  UserStatus,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import {
  boolean,
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  useQueryStateSlice,
  values,
} from "@parallel/utils/queryState";
import { isAdmin } from "@parallel/utils/roles";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  dialog: boolean(),
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
        sortBy: [`${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy],
      },
    })
  );

  const [showDialog, setShowDialog] = useQueryStateSlice(state, setQueryState, "dialog");

  const hasSsoProvider = me.organization.hasSsoProvider;
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

  const sections = useOrganizationSections(me);

  const columns = useOrganizationUsersTableColumns(me);

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

  const [createOrganizationUser] = useOrganizationUsers_createOrganizationUserMutation();
  const showCreateOrUpdateUserDialog = useCreateOrUpdateUserDialog();
  const handleCreateUser = async () => {
    try {
      const newUser = await showCreateOrUpdateUserDialog({ type: "create" });
      await createOrganizationUser({
        variables: { ...newUser, locale: intl.locale },
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

  useEffect(() => {
    if (showDialog) {
      handleCreateUser();
      setShowDialog(null);
    }
  }, [showDialog]);

  const [updateOrganizationUser] = useOrganizationUsers_updateOrganizationUserMutation();
  const handleUpdateUser = async (user: OrganizationUsers_UserFragment) => {
    try {
      const { role } = await showCreateOrUpdateUserDialog({
        type: "update",
        user: {
          email: user.email,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          role: user.role,
        },
      });

      await updateOrganizationUser({
        variables: { userId: user.id, role },
      });
      toast({
        title: intl.formatMessage({
          id: "organization.user-updated-success.toast-title",
          defaultMessage: "User updated successfully.",
        }),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {}
  };

  const showConfirmActivateUserDialog = useConfirmActivateUsersDialog();
  const showConfirmDeactivateUserDialog = useConfirmDeactivateUserDialog();
  const [updateUserStatus] = useOrganizationUsers_updateUserStatusMutation();
  const handleUpdateUserStatus = async (userIds: string[], newStatus: UserStatus) => {
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

  const isUserLimitReached = userList.totalCount >= me.organization.usageLimits.users.limit;

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
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.users.title" defaultMessage="Users" />
        </Heading>
      }
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} backgroundColor={"gray.50"}>
        {isUserLimitReached ? <UserLimitReachedAlert /> : null}
        <TablePage
          flex="0 1 auto"
          minHeight={0}
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
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          onRowClick={(user) =>
            me.id !== user.id &&
            isAdmin(me) &&
            !user.isSsoUser &&
            user.role !== "OWNER" &&
            handleUpdateUser(user)
          }
          header={
            <OrganizationUsersListTableHeader
              me={me}
              search={search}
              selectedUsers={selectedUsers}
              hasSsoProvider={hasSsoProvider}
              isCreateUserButtonDisabled={isUserLimitReached}
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

function useOrganizationUsersTableColumns(user: Pick<User, "role">) {
  const userIsAdmin = isAdmin(user);
  const intl = useIntl();
  return useMemo<TableColumn<OrganizationUsers_UserFragment>[]>(
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
              (
                {
                  OWNER: "purple",
                  ADMIN: "green",
                  NORMAL: "gray",
                } as Record<OrganizationRole, string>
              )[row.role]
            }
          >
            {row.role === "OWNER" ? (
              <FormattedMessage id="organization-users.owner-role" defaultMessage="Owner" />
            ) : row.role === "ADMIN" ? (
              <FormattedMessage id="organization-users.admin-role" defaultMessage="Admin" />
            ) : (
              <FormattedMessage id="organization-users.normal-role" defaultMessage="Normal" />
            )}
          </Badge>
        ),
      },
      ...(userIsAdmin
        ? ([
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
          ] as TableColumn<OrganizationUsers_UserFragment>[])
        : []),
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
        firstName
        lastName
        email
        role
        createdAt
        lastActiveAt
        status
        isSsoUser
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
      $locale: String
    ) {
      createOrganizationUser(
        email: $email
        firstName: $firstName
        lastName: $lastName
        role: $role
        locale: $locale
      ) {
        ...OrganizationUsers_User
      }
    }
    ${OrganizationUsers.fragments.User}
  `,
  gql`
    mutation OrganizationUsers_updateOrganizationUser($userId: GID!, $role: OrganizationRole!) {
      updateOrganizationUser(userId: $userId, role: $role) {
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
      updateUserStatus(userIds: $userIds, status: $newStatus, transferToUserId: $transferToUserId) {
        id
        status
      }
    }
  `,
];

OrganizationUsers.getInitialProps = async ({ fetchQuery, ...context }: WithApolloDataContext) => {
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
            hasSsoProvider
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
            usageLimits {
              users {
                limit
              }
            }
          }
          ...SettingsLayout_User
          ...OrganizationUsersListTableHeader_User
        }
      }
      ${SettingsLayout.fragments.User}
      ${OrganizationUsers.fragments.User}
      ${OrganizationUsersListTableHeader.fragments.User}
    `,
    {
      variables: {
        offset: items * (page - 1),
        limit: items,
        search,
        sortBy: [`${sort.field}_${sort.direction}` as OrganizationUsers_OrderBy],
      },
    }
  );
};

export default compose(withDialogs, withApolloData)(OrganizationUsers);
