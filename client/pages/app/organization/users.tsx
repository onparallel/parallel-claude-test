import { gql, useMutation } from "@apollo/client";
import { Badge, Flex, Heading, Text, Tooltip, useToast } from "@chakra-ui/react";
import {
  ArrowUpRightIcon,
  ForbiddenIcon,
  LogInIcon,
  UserCheckIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserSelectSelection } from "@parallel/components/common/UserSelect";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useConfirmActivateUsersDialog } from "@parallel/components/organization/dialogs/ConfirmActivateUsersDialog";
import { useConfirmDeactivateUserDialog } from "@parallel/components/organization/dialogs/ConfirmDeactivateUserDialog";
import { useConfirmResendInvitationDialog } from "@parallel/components/organization/dialogs/ConfirmResendInvitationDialog";
import { useCreateOrUpdateUserDialog } from "@parallel/components/organization/dialogs/CreateOrUpdateUserDialog";
import { OrganizationUsersListTableHeader } from "@parallel/components/organization/OrganizationUsersListTableHeader";
import { UserLimitReachedAlert } from "@parallel/components/organization/UserLimitReachedAlert";
import {
  OrganizationRole,
  OrganizationUsers_activateUserDocument,
  OrganizationUsers_createOrganizationUserDocument,
  OrganizationUsers_deactivateUserDocument,
  OrganizationUsers_OrderBy,
  OrganizationUsers_resetTemporaryPasswordDocument,
  OrganizationUsers_updateOrganizationUserDocument,
  OrganizationUsers_userDocument,
  OrganizationUsers_UserFragment,
  User,
  UserStatus,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { withError } from "@parallel/utils/promises/withError";
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
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useLoginAs } from "@parallel/utils/useLoginAs";
import { useOrganizationRoles } from "@parallel/utils/useOrganizationRoles";
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
    data: { me, realMe },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(OrganizationUsers_userDocument, {
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
      search: state.search,
      sortBy: [`${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy],
    },
  });

  const userIsAdmin = isAdmin(me.role);

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

  const [createOrganizationUser] = useMutation(OrganizationUsers_createOrganizationUserDocument);
  const showCreateOrUpdateUserDialog = useCreateOrUpdateUserDialog();
  const handleCreateUser = async () => {
    try {
      const { userGroups, ...user } = await showCreateOrUpdateUserDialog({
        myId: me.id,
      });

      await createOrganizationUser({
        variables: {
          ...user,
          userGroupIds: userGroups.map((userGroup) => userGroup.id),
          locale: intl.locale,
        },
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
          { email: user.email }
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

  const [updateOrganizationUser] = useMutation(OrganizationUsers_updateOrganizationUserDocument);
  const handleUpdateUser = async (user: OrganizationUsers_UserFragment) => {
    try {
      const { role, userGroups } = await showCreateOrUpdateUserDialog({
        user,
        myId: me.id,
      });

      await updateOrganizationUser({
        variables: {
          userId: user.id,
          role,
          userGroupIds: userGroups.map((userGroup) => userGroup.id),
        },
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
  const [activateUser] = useMutation(OrganizationUsers_activateUserDocument);
  const [deactivateUser] = useMutation(OrganizationUsers_deactivateUserDocument);

  const handleUpdateUserStatus = async (newStatus: UserStatus) => {
    try {
      let transferToUser: Maybe<UserSelectSelection> = null;
      if (newStatus === "ACTIVE") {
        await showConfirmActivateUserDialog({ count: selected.length });

        await activateUser({
          variables: {
            userIds: selected,
          },
        });
      } else if (newStatus === "INACTIVE") {
        transferToUser = await showConfirmDeactivateUserDialog({ selected });

        await deactivateUser({
          variables: {
            userIds: selected,
            transferToUserId: transferToUser?.id,
          },
        });
      }
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

  const showConfirmResendInvitationDialog = useConfirmResendInvitationDialog();
  const [resetTemporaryPassword] = useMutation(OrganizationUsers_resetTemporaryPasswordDocument);
  const genericErrorToast = useGenericErrorToast();
  async function handleResendInvitation() {
    try {
      await showConfirmResendInvitationDialog({ fullName: selectedUsers[0].fullName ?? "" });
      await resetTemporaryPassword({
        variables: { email: selectedUsers[0].email, locale: intl.locale },
      });

      toast({
        title: intl.formatMessage({
          id: "organization.user-invitation-sent.toast-title",
          defaultMessage: "Invitation sent",
        }),
        description: intl.formatMessage(
          {
            id: "organization.user-created-success.toast-description",
            defaultMessage:
              "We have sent an email to {email} with instructions to register in Parallel.",
          },
          { email: selectedUsers[0].email }
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {
      genericErrorToast();
    }
  }

  const loginAs = useLoginAs();
  const handleLoginAs = async () => {
    await loginAs(selected[0]);
  };

  const showErrorDialog = useErrorDialog();
  const handleUpdateSelectedUsersStatus = async (newStatus: UserStatus) => {
    if (selectedUsers.some((u) => u.role === "OWNER")) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage({
            id: "organization-users.update-user-status.error.deactivate-owner-user",
            defaultMessage:
              "You can't deactivate the owner. Please, remove it from the selection and try again.",
          }),
        })
      );
    } else if (selectedUsers.some((u) => u.id === me.id)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage({
            id: "organization-users.update-user-status.error.deactivate-own-user",
            defaultMessage:
              "You can't deactivate your own user. Please, remove it from the selection and try again.",
          }),
        })
      );
    } else if (selectedUsers.some((u) => u.isSsoUser)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage(
            {
              id: "organization-users.update-user-status.error.update-sso-user",
              defaultMessage:
                "{count, plural, =1{The user you selected is} other{Some of the users you selected are}} managed by a SSO provider. Please, update its status directly on the provider.",
            },
            { count: selectedUsers.length }
          ),
        })
      );
    } else {
      handleUpdateUserStatus(newStatus);
    }
  };

  const isUserLimitReached =
    me.organization.activeUserCount >= me.organization.usageLimits.users.limit;

  const isActivateUserButtonDisabled =
    me.organization.activeUserCount + selectedUsers.filter((u) => u.status === "INACTIVE").length >
    me.organization.usageLimits.users.limit;

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.users.title",
        defaultMessage: "Users",
      })}
      basePath="/app/organization"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.users.title" defaultMessage="Users" />
        </Heading>
      }
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
        {isUserLimitReached ? <UserLimitReachedAlert /> : null}
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isSelectable={userIsAdmin}
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
          onRowClick={userIsAdmin ? (user) => handleUpdateUser(user) : undefined}
          actions={[
            {
              key: "activate",
              onClick: () => handleUpdateSelectedUsersStatus("ACTIVE"),
              isDisabled:
                selectedUsers.every((u) => u.status === "ACTIVE") || isActivateUserButtonDisabled,
              leftIcon: <UserCheckIcon />,
              children: (
                <FormattedMessage
                  id="organization-users.activate"
                  defaultMessage="Activate {count, plural, =1{user} other {users}}"
                  values={{ count: selectedUsers.length }}
                />
              ),
            },
            {
              key: "deactivate",
              onClick: () => handleUpdateSelectedUsersStatus("INACTIVE"),
              isDisabled: selectedUsers.every((u) => u.status === "INACTIVE"),
              leftIcon: <UserXIcon />,
              children: (
                <FormattedMessage
                  id="organization-users.deactivate"
                  defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
                  values={{ count: selectedUsers.length }}
                />
              ),
            },
            ...(me.hasGhostLogin
              ? [
                  {
                    key: "login-as",
                    onClick: handleLoginAs,
                    isDisabled:
                      selectedUsers.length !== 1 ||
                      selectedUsers[0].id === me.id ||
                      selectedUsers[0].status === "INACTIVE",
                    leftIcon: <LogInIcon />,
                    children: (
                      <FormattedMessage
                        id="organization-users.login-as"
                        defaultMessage="Login as..."
                      />
                    ),
                  },
                ]
              : []),
            ...(userIsAdmin
              ? [
                  {
                    key: "reset-password",
                    onClick: handleResendInvitation,
                    isDisabled:
                      selectedUsers.some((u) => u.lastActiveAt) || selectedUsers.length !== 1,
                    leftIcon: <ArrowUpRightIcon />,
                    children: (
                      <FormattedMessage
                        id="organization-users.resend-invitation"
                        defaultMessage="Resend invitation"
                      />
                    ),
                  },
                ]
              : []),
          ]}
          header={
            <OrganizationUsersListTableHeader
              search={search}
              hasSsoProvider={hasSsoProvider}
              isCreateUserButtonDisabled={isUserLimitReached}
              isActivateUserButtonDisabled={isActivateUserButtonDisabled}
              onCreateUser={handleCreateUser}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
            />
          }
        />
      </Flex>
    </SettingsLayout>
  );
}

function useOrganizationUsersTableColumns(user: Pick<User, "role">) {
  const userIsAdmin = isAdmin(user.role);
  const intl = useIntl();
  const roles = useOrganizationRoles();
  return useMemo<TableColumn<OrganizationUsers_UserFragment>[]>(
    () => [
      {
        key: "fullName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: userIsAdmin ? "30%" : "46%",
          minWidth: "220px",
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
          minWidth: "220px",
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
          minWidth: "200px",
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
      ...(userIsAdmin
        ? ([
            {
              key: "lastActiveAt",
              header: intl.formatMessage({
                id: "generic.last-active-at",
                defaultMessage: "Last active at",
              }),
              isSortable: true,
              cellProps: {
                width: "16%",
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
          width: "14%",
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
        userGroups {
          id
          ...useCreateOrUpdateUserDialog_UserGroup
        }
      }
      ${useCreateOrUpdateUserDialog.fragments.UserGroup}
    `;
  },
};

const _mutations = [
  gql`
    mutation OrganizationUsers_createOrganizationUser(
      $firstName: String!
      $lastName: String!
      $email: String!
      $role: OrganizationRole!
      $locale: String
      $userGroupIds: [GID!]
    ) {
      createOrganizationUser(
        email: $email
        firstName: $firstName
        lastName: $lastName
        role: $role
        locale: $locale
        userGroupIds: $userGroupIds
      ) {
        ...OrganizationUsers_User
      }
    }
    ${OrganizationUsers.fragments.User}
  `,
  gql`
    mutation OrganizationUsers_updateOrganizationUser(
      $userId: GID!
      $role: OrganizationRole!
      $userGroupIds: [GID!]
    ) {
      updateOrganizationUser(userId: $userId, role: $role, userGroupIds: $userGroupIds) {
        ...OrganizationUsers_User
      }
    }
    ${OrganizationUsers.fragments.User}
  `,
  gql`
    mutation OrganizationUsers_activateUser($userIds: [GID!]!) {
      activateUser(userIds: $userIds) {
        id
        status
      }
    }
  `,
  gql`
    mutation OrganizationUsers_deactivateUser(
      $userIds: [GID!]!
      $transferToUserId: GID
      $deletePetitions: Boolean
    ) {
      deactivateUser(
        userIds: $userIds
        transferToUserId: $transferToUserId
        deletePetitions: $deletePetitions
      ) {
        id
        status
      }
    }
  `,
  gql`
    mutation OrganizationUsers_resetTemporaryPassword($email: String!, $locale: String) {
      resetTemporaryPassword(email: $email, locale: $locale)
    }
  `,
];

OrganizationUsers.queries = [
  gql`
    query OrganizationUsers_user(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [OrganizationUsers_OrderBy!]
    ) {
      ...SettingsLayout_Query
      me {
        hasGhostLogin: hasFeatureFlag(featureFlag: GHOST_LOGIN)
        organization {
          id
          hasSsoProvider
          activeUserCount
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
      }
    }
    ${SettingsLayout.fragments.Query}
    ${OrganizationUsers.fragments.User}
  `,
];

OrganizationUsers.getInitialProps = async ({ fetchQuery, ...context }: WithApolloDataContext) => {
  const { page, items, search, sort } = parseQuery(context.query, QUERY_STATE);
  await fetchQuery(OrganizationUsers_userDocument, {
    variables: {
      offset: items * (page - 1),
      limit: items,
      search,
      sortBy: [`${sort.field}_${sort.direction}` as OrganizationUsers_OrderBy],
    },
  });
};

export default compose(withDialogs, withApolloData)(OrganizationUsers);
