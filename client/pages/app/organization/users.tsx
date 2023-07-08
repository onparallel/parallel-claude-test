import { gql, useMutation } from "@apollo/client";
import { Badge, Flex, Heading, Text, Tooltip, useToast } from "@chakra-ui/react";
import {
  AlertCircleFilledIcon,
  ArrowUpRightIcon,
  ForbiddenIcon,
  LogInIcon,
  UserCheckIcon,
  UserXIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { isDialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { useConfirmActivateUsersDialog } from "@parallel/components/organization/dialogs/ConfirmActivateUsersDialog";
import { useConfirmDeactivateUserDialog } from "@parallel/components/organization/dialogs/ConfirmDeactivateUserDialog";
import { useConfirmResendInvitationDialog } from "@parallel/components/organization/dialogs/ConfirmResendInvitationDialog";
import { useCreateOrUpdateUserDialog } from "@parallel/components/organization/dialogs/CreateOrUpdateUserDialog";
import { OrganizationUsersListTableHeader } from "@parallel/components/organization/OrganizationUsersListTableHeader";
import { UserLimitReachedAlert } from "@parallel/components/organization/UserLimitReachedAlert";
import {
  OrganizationRole,
  OrganizationUsers_activateUserDocument,
  OrganizationUsers_deactivateUserDocument,
  OrganizationUsers_inviteUserToOrganizationDocument,
  OrganizationUsers_OrderBy,
  OrganizationUsers_orgUsersDocument,
  OrganizationUsers_resetTempPasswordDocument,
  OrganizationUsers_updateOrganizationUserDocument,
  OrganizationUsers_userDocument,
  OrganizationUsers_UserFragment,
  UserStatus,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { asSupportedUserLocale } from "@parallel/utils/locales";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { withError } from "@parallel/utils/promises/withError";
import { integer, sorting, string, useQueryState, values } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useLoginAs } from "@parallel/utils/useLoginAs";
import { useOrganizationRoles } from "@parallel/utils/useOrganizationRoles";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const userCanEditUsers = useHasPermission("USERS:CRUD_USERS");
  const userCanGhostLogin = useHasPermission("USERS:GHOST_LOGIN");

  const hasSsoProvider = me.organization.hasSsoProvider;
  const users = data?.me.organization.users;

  const showTransferUserDialog = useRef(false);

  const { selectedRows, selectedIds, onChangeSelectedIds } = useSelection(users?.items, "id");

  const isUserLimitReached =
    me.organization.activeUserCount >= me.organization.usageDetails.USER_LIMIT;

  useTempQueryParam("dialog", () => {
    if (!isUserLimitReached) {
      handleCreateUser();
    }
  });

  useTempQueryParam("transfer", () => {
    showTransferUserDialog.current = true;
  });

  useEffect(() => {
    if (showTransferUserDialog.current) {
      if (isDefined(state.search) && isDefined(users)) {
        const user = users.items.find((user) => user!.email === state.search);
        if (user?.status === "ON_HOLD") {
          handleUpdateUser(user);
        }
        showTransferUserDialog.current = false;
      }
    }
  }, [users, loading]);

  const isActivateUserButtonDisabled =
    me.organization.activeUserCount + selectedRows.filter((u) => u.status === "INACTIVE").length >
    me.organization.usageDetails.USER_LIMIT;

  const [search, setSearch] = useState(state.search);

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
    [setQueryState],
  );
  const handleSearchChange = useCallback(
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange],
  );

  const showGenericErrorToast = useGenericErrorToast();
  const [inviteUserToOrganization] = useMutation(
    OrganizationUsers_inviteUserToOrganizationDocument,
  );
  const showCreateOrUpdateUserDialog = useCreateOrUpdateUserDialog();
  const handleCreateUser = async () => {
    try {
      const data = await showCreateOrUpdateUserDialog({});
      const { userGroups, ...user } = data;
      await inviteUserToOrganization({
        variables: {
          ...user,
          userGroupIds: userGroups.map((userGroup) => userGroup.id),
          locale: asSupportedUserLocale(intl.locale),
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
          { email: user.email },
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      if (isDialogError(error)) {
        return;
      } else if (isApolloError(error, "USER_ALREADY_IN_ORG_ERROR")) {
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
      } else if (isApolloError(error, "USER_LIMIT_ERROR")) {
        toast({
          status: "error",
          title: intl.formatMessage({
            id: "organization.user-limit-reached.toast-title",
            defaultMessage: "User limit reached",
          }),
          description: intl.formatMessage({
            id: "organization.user-limit-reached.toast-description",
            defaultMessage: "You reached the maximum amount of users you can create.",
          }),
          isClosable: true,
          duration: 5000,
        });
      } else {
        showGenericErrorToast(error);
      }
    }
  };

  const showConfirmDeactivateUserDialog = useConfirmDeactivateUserDialog();
  const [updateOrganizationUser] = useMutation(OrganizationUsers_updateOrganizationUserDocument);
  const handleUpdateUser = async (user: OrganizationUsers_UserFragment) => {
    try {
      if (user.status === "ON_HOLD") {
        const { userId, tagIds, includeDrafts } = await showConfirmDeactivateUserDialog({
          users: [user],
        });

        await deactivateUser({
          variables: {
            userIds: [user.id],
            transferToUserId: userId,
            tagIds,
            includeDrafts,
          },
        });
        toast({
          title: intl.formatMessage({
            id: "organization.parallels-transfer-success.toast-title",
            defaultMessage: "Parallels transferred successfully.",
          }),
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
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
      }
    } catch {}
  };

  const showConfirmActivateUserDialog = useConfirmActivateUsersDialog();
  const [activateUser] = useMutation(OrganizationUsers_activateUserDocument);
  const [deactivateUser] = useMutation(OrganizationUsers_deactivateUserDocument);

  const handleUpdateUserStatus = async (newStatus: UserStatus) => {
    try {
      if (newStatus === "ACTIVE") {
        await showConfirmActivateUserDialog({ count: selectedIds.length });

        await activateUser({
          variables: {
            userIds: selectedIds,
          },
        });
      } else if (newStatus === "INACTIVE") {
        const { userId, tagIds, includeDrafts } = await showConfirmDeactivateUserDialog({
          users: selectedRows,
        });

        await deactivateUser({
          variables: {
            userIds: selectedIds,
            transferToUserId: userId,
            tagIds,
            includeDrafts,
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
  const [resetTempPassword] = useMutation(OrganizationUsers_resetTempPasswordDocument);
  async function handleResendInvitation() {
    try {
      await showConfirmResendInvitationDialog({ fullName: selectedRows[0].fullName ?? "" });
      await resetTempPassword({
        variables: { email: selectedRows[0].email, locale: asSupportedUserLocale(intl.locale) },
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
          { email: selectedRows[0].email },
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      if (isDialogError(error)) {
        return;
      } else if (isApolloError(error, "RESET_USER_PASSWORD_TIME_RESTRICTION")) {
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
            { email: selectedRows[0].email },
          ),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (isApolloError(error, "RESET_USER_PASSWORD_STATUS_ERROR")) {
        toast({
          title: intl.formatMessage({
            id: "organization.user-invitation-not-sent-error.toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage({
            id: "organization.user-invitation-status-error.toast-description",
            defaultMessage:
              "It seems the user has already logged in. There is no need to resend the invitation.",
          }),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (isApolloError(error, "RESET_USER_PASSWORD_INACTIVE_ERROR")) {
        toast({
          title: intl.formatMessage({
            id: "organization.user-invitation-not-sent-error.toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage({
            id: "organization.user-invitation-inactive-error.toast-description",
            defaultMessage: "The selected user is inactive. Refresh your browser and try again.",
          }),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (isApolloError(error, "RESET_USER_PASSWORD_SSO_ERROR")) {
        toast({
          title: intl.formatMessage({
            id: "organization.user-invitation-not-sent-error.toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage({
            id: "organization.user-invitation-sso-error.toast-description",
            defaultMessage: "We can't resend the invitation to SSO users.",
          }),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        showGenericErrorToast(error);
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
        }),
      );
    } else if (selectedRows.some((u) => u.id === me.id)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage({
            id: "organization-users.update-user-status.error.deactivate-own-user",
            defaultMessage:
              "You can't deactivate your own user. Please, remove it from the selection and try again.",
          }),
        }),
      );
    } else if (selectedRows.some((u) => u.isSsoUser && u.status !== "ON_HOLD")) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage(
            {
              id: "organization-users.update-user-status.error.update-sso-user",
              defaultMessage:
                "{count, plural, =1{The user you selected is} other{Some of the users you selected are}} managed by a SSO provider. Please, update its status directly on the provider.",
            },
            { count: selectedRows.length },
          ),
        }),
      );
    } else {
      handleUpdateUserStatus(newStatus);
    }
  };

  return (
    <OrganizationSettingsLayout
      title={intl.formatMessage({
        id: "organization.users.title",
        defaultMessage: "Users",
      })}
      me={me}
      realMe={realMe}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.users.title" defaultMessage="Users" />
        </Heading>
      }
    >
      <Flex direction="column" flex="1" minHeight={0} padding={4} paddingBottom={24}>
        {isUserLimitReached ? <UserLimitReachedAlert /> : null}
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isSelectable={userCanEditUsers}
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
          onRowClick={userCanEditUsers ? (user) => handleUpdateUser(user) : undefined}
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
            ...(me.hasGhostLogin && userCanGhostLogin
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
            ...(userCanEditUsers
              ? [
                  {
                    key: "reset-password",
                    onClick: handleResendInvitation,
                    isDisabled:
                      selectedRows.some(
                        (u) => u.lastActiveAt || u.status === "INACTIVE" || u.isSsoUser,
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
    </OrganizationSettingsLayout>
  );
}

function useOrganizationUsersTableColumns() {
  const userCanEdit = useHasPermission("USERS:CRUD_USERS");
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
          width: userCanEdit ? "30%" : "46%",
          minWidth: "220px",
        },
        CellContent: ({ row }) => {
          return (
            <Text
              as="span"
              display="inline-flex"
              whiteSpace="nowrap"
              alignItems="center"
              opacity={row.status === "INACTIVE" ? 0.5 : 1}
            >
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
                    aria-label={intl.formatMessage({
                      id: "organization-users.header.inactive-user",
                      defaultMessage: "Inactive user",
                    })}
                  />
                </Tooltip>
              ) : row.status === "ON_HOLD" ? (
                <Tooltip
                  label={intl.formatMessage({
                    id: "organization-users.header.untransferred-parallels",
                    defaultMessage: "Untransferred parallels",
                  })}
                >
                  <AlertCircleFilledIcon
                    color="yellow.500"
                    marginLeft={2}
                    aria-label={intl.formatMessage({
                      id: "organization-users.header.untransferred-parallels",
                      defaultMessage: "Untransferred parallels",
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
        CellContent: ({ row }) => (
          <Text opacity={row.status === "INACTIVE" ? 0.5 : 1}>{row.email}</Text>
        ),
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
            opacity={row.status === "INACTIVE" ? 0.5 : 1}
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
      ...(userCanEdit
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
                    opacity={row.status === "INACTIVE" ? 0.5 : 1}
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
            opacity={row.status === "INACTIVE" ? 0.5 : 1}
          />
        ),
      },
    ],
    [intl.locale],
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
        ...useConfirmDeactivateUserDialog_User
      }
      ${useCreateOrUpdateUserDialog.fragments.User}
      ${useConfirmDeactivateUserDialog.fragments.User}
    `;
  },
};

const _mutations = [
  gql`
    mutation OrganizationUsers_inviteUserToOrganization(
      $firstName: String!
      $lastName: String!
      $email: String!
      $role: OrganizationRole!
      $locale: UserLocale!
      $userGroupIds: [GID!]
    ) {
      inviteUserToOrganization(
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
      $transferToUserId: GID!
      $tagIds: [GID!]
      $includeDrafts: Boolean
    ) {
      deactivateUser(
        userIds: $userIds
        transferToUserId: $transferToUserId
        tagIds: $tagIds
        includeDrafts: $includeDrafts
      ) {
        id
        status
      }
    }
  `,
  gql`
    mutation OrganizationUsers_resetTempPassword($email: String!, $locale: UserLocale!) {
      resetTempPassword(email: $email, locale: $locale)
    }
  `,
];

OrganizationUsers.queries = [
  gql`
    query OrganizationUsers_user {
      ...OrganizationSettingsLayout_Query
      me {
        hasGhostLogin: hasFeatureFlag(featureFlag: GHOST_LOGIN)
        organization {
          id
          hasSsoProvider
          activeUserCount
          usageDetails
        }
      }
    }
    ${OrganizationSettingsLayout.fragments.Query}
  `,
  gql`
    query OrganizationUsers_orgUsers(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [OrganizationUsers_OrderBy!]
    ) {
      me {
        id
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
      }
    }
    ${OrganizationUsers.fragments.User}
  `,
];

OrganizationUsers.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationUsers_userDocument);
};

export default compose(
  withDialogs,
  withPermission("USERS:LIST_USERS", { orPath: "/app/organization" }),
  withApolloData,
)(OrganizationUsers);
