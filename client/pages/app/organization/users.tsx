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
  OrganizationUsers_orgUsersDocument,
  OrganizationUsers_resetTemporaryPasswordDocument,
  OrganizationUsers_updateOrganizationUserDocument,
  OrganizationUsers_userDocument,
  OrganizationUsers_UserFragment,
  User,
  UserStatus,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { withError } from "@parallel/utils/promises/withError";
import {
  boolean,
  integer,
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
import { useSelection } from "@parallel/utils/useSelectionState";
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
  } = useAssertQuery(OrganizationUsers_userDocument);

  const { data, loading, refetch } = useQueryOrPreviousData(OrganizationUsers_orgUsersDocument, {
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
      search: state.search,
      sortBy: [`${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy],
    },
  });

  const userIsAdmin = isAdmin(me.role);

  const [showDialog, setShowDialog] = useQueryStateSlice(state, setQueryState, "dialog");

  const hasSsoProvider = data?.me.organization.hasSsoProvider ?? false;
  const users = data?.me.organization.users;

  const { selectedRows, selectedIds, onChangeSelectedIds } = useSelection(users?.items, "id");

  const isUserLimitReached = loading
    ? false
    : data!.me.organization.activeUserCount >= data!.me.organization.usageLimits.users.limit;

  const isActivateUserButtonDisabled = loading
    ? false
    : data!.me.organization.activeUserCount +
        selectedRows.filter((u) => u.status === "INACTIVE").length >
      data!.me.organization.usageLimits.users.limit;

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

  const genericError = useGenericErrorToast();
  const [createOrganizationUser] = useMutation(OrganizationUsers_createOrganizationUserDocument);
  const showCreateOrUpdateUserDialog = useCreateOrUpdateUserDialog();
  const handleCreateUser = async () => {
    try {
      const [error, data] = await withError(showCreateOrUpdateUserDialog({}));
      if (error || !data) {
        return;
      }
      const { userGroups, ...user } = data;
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
    } catch (e: any) {
      if (isApolloError(e, "USER_ALREADY_IN_ORG_ERROR")) {
        toast({
          status: "info",
          title: intl.formatMessage({
            id: "organization.user-already-registered.toast-title",
            defaultMessage: "User already registered",
          }),
          description: intl.formatMessage({
            id: "organization.user-already-registered.toast-description",
            defaultMessage: "The provided email is already registered on the organization.",
          }),
          isClosable: true,
        });
      } else {
        genericError();
      }
    }
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
      const { role, userGroups } = await showCreateOrUpdateUserDialog({ user });

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
        await showConfirmActivateUserDialog({ count: selectedIds.length });

        await activateUser({
          variables: {
            userIds: selectedIds,
          },
        });
      } else if (newStatus === "INACTIVE") {
        transferToUser = await showConfirmDeactivateUserDialog({ userIds: selectedIds });

        await deactivateUser({
          variables: {
            userIds: selectedIds,
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
      await showConfirmResendInvitationDialog({ fullName: selectedRows[0].fullName ?? "" });
      await resetTemporaryPassword({
        variables: { email: selectedRows[0].email, locale: intl.locale },
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
          { email: selectedRows[0].email }
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (e: any) {
      if (isApolloError(e, "RESET_USER_PASSWORD_TIME_RESTRICTION")) {
        toast({
          title: intl.formatMessage({
            id: "organization.user-invitation-sent-error.toast-title",
            defaultMessage: "Invitation already sent",
          }),
          description: intl.formatMessage(
            {
              id: "organization.user-invitation-sent-error.toast-description",
              defaultMessage: "An invitation has been sent to {email} recently, try again later.",
            },
            { email: selectedRows[0].email }
          ),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (isApolloError(e, "RESET_USER_PASSWORD_STATUS_ERROR")) {
        toast({
          title: intl.formatMessage({
            id: "organization.user-invitation-not-sent-error.toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage(
            {
              id: "organization.user-invitation-status-error.toast-description",
              defaultMessage:
                "It seems the user has already logged in. There is no need to resend the invitation.",
            },
            { email: selectedRows[0].email }
          ),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (isApolloError(e, "RESET_USER_PASSWORD_INACTIVE_ERROR")) {
        toast({
          title: intl.formatMessage({
            id: "organization.user-invitation-not-sent-error.toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage(
            {
              id: "organization.user-invitation-inactive-error.toast-description",
              defaultMessage: "The selected user is inactive. Refresh your browser and try again.",
            },
            { email: selectedRows[0].email }
          ),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (isApolloError(e, "RESET_USER_PASSWORD_SSO_ERROR")) {
        toast({
          title: intl.formatMessage({
            id: "organization.user-invitation-not-sent-error.toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage(
            {
              id: "organization.user-invitation-sso-error.toast-description",
              defaultMessage: "We can't resend the invitation to SSO users.",
            },
            { email: selectedRows[0].email }
          ),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (e.message !== "CANCEL" && e.message !== "CLOSE") {
        genericErrorToast();
      }
    }
  }

  const loginAs = useLoginAs();
  const handleLoginAs = async () => {
    await loginAs(selectedIds[0]);
  };

  const showErrorDialog = useErrorDialog();
  const handleUpdateSelectedUsersStatus = async (newStatus: UserStatus) => {
    if (selectedRows.some((u) => u.role === "OWNER")) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage({
            id: "organization-users.update-user-status.error.deactivate-owner-user",
            defaultMessage:
              "You can't deactivate the owner. Please, remove it from the selection and try again.",
          }),
        })
      );
    } else if (selectedRows.some((u) => u.id === me.id)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage({
            id: "organization-users.update-user-status.error.deactivate-own-user",
            defaultMessage:
              "You can't deactivate your own user. Please, remove it from the selection and try again.",
          }),
        })
      );
    } else if (selectedRows.some((u) => u.isSsoUser)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage(
            {
              id: "organization-users.update-user-status.error.update-sso-user",
              defaultMessage:
                "{count, plural, =1{The user you selected is} other{Some of the users you selected are}} managed by a SSO provider. Please, update its status directly on the provider.",
            },
            { count: selectedRows.length }
          ),
        })
      );
    } else {
      handleUpdateUserStatus(newStatus);
    }
  };

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
          onRowClick={userIsAdmin ? (user) => handleUpdateUser(user) : undefined}
          actions={[
            {
              key: "activate",
              onClick: () => handleUpdateSelectedUsersStatus("ACTIVE"),
              isDisabled:
                selectedRows.every((u) => u.status === "ACTIVE") || isActivateUserButtonDisabled,
              leftIcon: <UserCheckIcon />,
              children: (
                <FormattedMessage
                  id="organization-users.activate"
                  defaultMessage="Activate {count, plural, =1{user} other {users}}"
                  values={{ count: selectedRows.length }}
                />
              ),
            },
            {
              key: "deactivate",
              onClick: () => handleUpdateSelectedUsersStatus("INACTIVE"),
              isDisabled: selectedRows.every((u) => u.status === "INACTIVE"),
              leftIcon: <UserXIcon />,
              children: (
                <FormattedMessage
                  id="organization-users.deactivate"
                  defaultMessage="Deactivate {count, plural, =1{user} other {users}}"
                  values={{ count: selectedRows.length }}
                />
              ),
            },
            ...(me.hasGhostLogin
              ? [
                  {
                    key: "login-as",
                    onClick: handleLoginAs,
                    isDisabled:
                      selectedRows.length !== 1 ||
                      selectedRows[0].id === me.id ||
                      selectedRows[0].status === "INACTIVE",
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
                      selectedRows.some(
                        (u) => u.lastActiveAt || u.status === "INACTIVE" || u.isSsoUser
                      ) || selectedRows.length !== 1,
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
        ...useCreateOrUpdateUserDialog_User
      }
      ${useCreateOrUpdateUserDialog.fragments.User}
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
    query OrganizationUsers_user {
      ...SettingsLayout_Query
      me {
        hasGhostLogin: hasFeatureFlag(featureFlag: GHOST_LOGIN)
      }
    }
    ${SettingsLayout.fragments.Query}
  `,
  gql`
    query OrganizationUsers_orgUsers(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [OrganizationUsers_OrderBy!]
    ) {
      me {
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
    ${OrganizationUsers.fragments.User}
  `,
];

OrganizationUsers.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationUsers_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationUsers);
