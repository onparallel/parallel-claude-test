import { gql, useMutation } from "@apollo/client";
import { Badge, Flex, Heading, Stack, Text, useToast } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  AlertCircleFilledIcon,
  ArrowUpRightIcon,
  KeyIcon,
  LogInIcon,
  UserCheckIcon,
  UserXIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { NormalLink } from "@parallel/components/common/Link";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { SimpleMenuSelect } from "@parallel/components/common/SimpleMenuSelect";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserReference } from "@parallel/components/common/UserReference";
import { isDialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { OrganizationUsersListTableHeader } from "@parallel/components/organization/OrganizationUsersListTableHeader";
import { UserLimitReachedAlert } from "@parallel/components/organization/UserLimitReachedAlert";
import { useConfirmActivateUsersDialog } from "@parallel/components/organization/dialogs/ConfirmActivateUsersDialog";
import { useConfirmDeactivateUserDialog } from "@parallel/components/organization/dialogs/ConfirmDeactivateUserDialog";
import { useConfirmResendInvitationDialog } from "@parallel/components/organization/dialogs/ConfirmResendInvitationDialog";
import { useCreateOrUpdateUserDialog } from "@parallel/components/organization/dialogs/CreateOrUpdateUserDialog";
import {
  OrganizationUsers_OrderBy,
  OrganizationUsers_UserFragment,
  OrganizationUsers_activateUserDocument,
  OrganizationUsers_deactivateUserDocument,
  OrganizationUsers_inviteUserToOrganizationDocument,
  OrganizationUsers_orgUsersDocument,
  OrganizationUsers_resetTempPasswordDocument,
  OrganizationUsers_updateUserGroupMembershipDocument,
  OrganizationUsers_userDocument,
  UserStatus,
} from "@parallel/graphql/__types";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { asSupportedUserLocale } from "@parallel/utils/locales";
import { withError } from "@parallel/utils/promises/withError";
import {
  integer,
  sorting,
  string,
  useQueryState,
  useQueryStateSlice,
  values,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useLoginAs } from "@parallel/utils/useLoginAs";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, sort } from "remeda";
const SORTING = ["fullName", "email", "createdAt", "lastActiveAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
  status: values(["ACTIVE", "INACTIVE", "ON_HOLD"]).orDefault("ACTIVE"),
};

interface OrganizationUserTableContext {
  status: UserStatus;
  setStatus: (status: UserStatus) => void;
  hasUserProvisioning: boolean;
}

function OrganizationUsers() {
  const intl = useIntl();
  const toast = useToast();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [status, setStatus] = useQueryStateSlice(state, setQueryState, "status");

  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationUsers_userDocument);

  const { data, loading, refetch } = useQueryOrPreviousData(OrganizationUsers_orgUsersDocument, {
    fetchPolicy: "cache-and-network",
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
      search: state.search,
      sortBy: [`${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy],
      filters: { status: [status] },
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
      if (isNonNullish(state.search) && isNonNullish(users)) {
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
          id: "page.users.user-created-success-toast-title",
          defaultMessage: "User created successfully.",
        }),
        description: intl.formatMessage(
          {
            id: "page.users.user-created-success-toast-description",
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
            id: "page.users.user-already-registered-toast-title",
            defaultMessage: "User already registered",
          }),
          description: intl.formatMessage({
            id: "page.users.user-already-registered-toast-description",
            defaultMessage: "The provided email is already registered on the organization.",
          }),
          isClosable: true,
        });
      } else if (isApolloError(error, "USER_LIMIT_ERROR")) {
        toast({
          status: "error",
          title: intl.formatMessage({
            id: "page.users.user-limit-reached-toast-title",
            defaultMessage: "User limit reached",
          }),
          description: intl.formatMessage({
            id: "page.users.user-limit-reached-toast-description",
            defaultMessage: "You reached the maximum amount of users you can create.",
          }),
          isClosable: true,
          duration: 5000,
        });
      } else if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
        const code = (error as any).graphQLErrors[0]?.extensions?.extra?.error_code;
        if (code === "INVALID_MX_EMAIL_ERROR" || code === "INVALID_EMAIL_ERROR") {
          toast({
            status: "error",
            title: intl.formatMessage({
              id: "page.organization-users.invalid-email-toast-title",
              defaultMessage: "Invalid email",
            }),
            description: intl.formatMessage({
              id: "page.organization-users.invalid-email-toast-description",
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
  };

  const showConfirmDeactivateUserDialog = useConfirmDeactivateUserDialog();
  const [updateUserGroupMembership] = useMutation(
    OrganizationUsers_updateUserGroupMembershipDocument,
  );
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
          update: () => {
            refetch();
          },
        });
        toast({
          title: intl.formatMessage({
            id: "page.users.parallels-transfer-success-toast-title",
            defaultMessage: "Parallels transferred successfully.",
          }),
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        const { userGroups } = await showCreateOrUpdateUserDialog({ user });

        await updateUserGroupMembership({
          variables: {
            userId: user.id,
            userGroupIds: userGroups
              .filter((ug) => ug.type !== "ALL_USERS")
              .map((userGroup) => userGroup.id),
          },
        });
        toast({
          title: intl.formatMessage({
            id: "page.users.user-updated-success-toast-title",
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
          update: () => {
            refetch();
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
          update: () => {
            refetch();
          },
        });
      }
      toast({
        title: intl.formatMessage({
          id: "generic.success",
          defaultMessage: "Success",
        }),
        description: intl.formatMessage({
          id: "page.users.user-updated-success-toast-title",
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
          id: "page.users.user-invitation-sent-toast-title",
          defaultMessage: "Invitation sent",
        }),
        description: intl.formatMessage(
          {
            id: "page.users.user-created-success-toast-description",
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
            id: "page.users.user-invitation-sent-error-toast-title",
            defaultMessage: "Invitation already sent",
          }),
          description: intl.formatMessage(
            {
              id: "page.users.user-invitation-sent-error-toast-description",
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
            id: "page.users.user-invitation-not-sent-error-toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage({
            id: "page.users.user-invitation-status-error-toast-description",
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
            id: "page.users.user-invitation-not-sent-error-toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage({
            id: "page.users.user-invitation-inactive-error-toast-description",
            defaultMessage: "The selected user is inactive. Refresh your browser and try again.",
          }),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (isApolloError(error, "RESET_USER_PASSWORD_SSO_ERROR")) {
        toast({
          title: intl.formatMessage({
            id: "page.users.user-invitation-not-sent-error-toast-title",
            defaultMessage: "Invitation not sent",
          }),
          description: intl.formatMessage({
            id: "page.users.user-invitation-sso-error-toast-description",
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
    if (selectedRows.some((u) => u.isOrgOwner)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage({
            id: "page.users.error-deactivate-owner-user",
            defaultMessage:
              "You can't deactivate the owner. Please, remove it from the selection and try again.",
          }),
        }),
      );
    } else if (selectedRows.some((u) => u.id === me.id)) {
      await withError(
        showErrorDialog({
          message: intl.formatMessage({
            id: "page.users.error-deactivate-own-user",
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
              id: "page.users.error-update-sso-user",
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

  const context = useMemo<OrganizationUserTableContext>(
    () => ({ status, setStatus, hasUserProvisioning: me.organization.hasUserProvisioning }),
    [status, setStatus],
  );

  return (
    <OrganizationSettingsLayout
      title={intl.formatMessage({
        id: "page.users.title",
        defaultMessage: "Users",
      })}
      me={me}
      realMe={realMe}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="page.users.title" defaultMessage="Users" />
        </Heading>
      }
    >
      <Flex direction="column" flex="1" minHeight={0} padding={4} paddingBottom={24}>
        {isUserLimitReached ? <UserLimitReachedAlert /> : null}
        <TablePage
          flex="0 1 auto"
          isSelectable={userCanEditUsers || userCanGhostLogin}
          isHighlightable
          context={context}
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
          actions={
            status === "INACTIVE"
              ? [
                  {
                    key: "activate",
                    onClick: () => handleUpdateSelectedUsersStatus("ACTIVE"),
                    isDisabled: isActivateUserButtonDisabled || !userCanEditUsers,
                    leftIcon: <UserCheckIcon />,
                    children: (
                      <FormattedMessage
                        id="page.users.activate-users"
                        defaultMessage="Activate {count, plural, =1{user} other {users}}"
                        values={{ count: selectedRows.length }}
                      />
                    ),
                  },
                ]
              : [
                  {
                    key: "deactivate",
                    isDisabled: !userCanEditUsers,
                    onClick: () => handleUpdateSelectedUsersStatus("INACTIVE"),
                    leftIcon: <UserXIcon />,
                    children: (
                      <FormattedMessage
                        id="page.users.deactivate-users"
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
                              id="page.users.login-as"
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
                              id="page.users.resend-invitation"
                              defaultMessage="Resend invitation"
                            />
                          ),
                        },
                      ]
                    : []),
                ]
          }
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
          body={
            users && users.totalCount === 0 && !loading ? (
              state.search || state.status[0] !== "ACTIVE" ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="page.organization-users.no-search-results"
                      defaultMessage="There's no users matching your criteria"
                    />
                  </Text>
                </Flex>
              ) : null
            ) : null
          }
          Footer={CustomFooter}
        />
      </Flex>
    </OrganizationSettingsLayout>
  );
}

function CustomFooter({
  status,
  setStatus,
  hasUserProvisioning,
  children,
}: PropsWithChildren<OrganizationUserTableContext>) {
  const options = useSimpleSelectOptions<UserStatus>(
    (intl) => [
      {
        label: intl.formatMessage({ id: "generic.user-status-active", defaultMessage: "Active" }),
        value: "ACTIVE",
      },
      {
        label: intl.formatMessage({
          id: "generic.user-status-inactive",
          defaultMessage: "Inactive",
        }),
        value: "INACTIVE",
      },
      ...(hasUserProvisioning
        ? [
            {
              label: intl.formatMessage({
                id: "generic.user-status-on-hold",
                defaultMessage: "On hold",
              }),
              value: "ON_HOLD" as UserStatus,
            },
          ]
        : []),
    ],
    [hasUserProvisioning],
  );
  return (
    <>
      <SimpleMenuSelect
        options={options}
        value={status}
        onChange={setStatus as any}
        size="sm"
        variant="ghost"
        data-action="user-status-filter"
      />
      {children}
    </>
  );
}

function useOrganizationUsersTableColumns() {
  const intl = useIntl();
  return useMemo<TableColumn<OrganizationUsers_UserFragment, OrganizationUserTableContext>[]>(
    () => [
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
              <UserReference as="span" user={row} />
              {row.status === "ON_HOLD" ? (
                <Tooltip
                  label={intl.formatMessage({
                    id: "page.users.untransferred-parallels",
                    defaultMessage: "Untransferred parallels",
                  })}
                >
                  <AlertCircleFilledIcon
                    color="yellow.500"
                    marginStart={2}
                    aria-label={intl.formatMessage({
                      id: "page.users.untransferred-parallels",
                      defaultMessage: "Untransferred parallels",
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
        key: "teams",
        label: intl.formatMessage({
          id: "page.users.table-teams-label",
          defaultMessage: "Teams",
        }),
        cellProps: {
          minWidth: "220px",
        },
        CellContent: ({ row }) => {
          const groups = sort(row.userGroups, (a, b) => {
            // type === ALL_USER always goes last
            if (a.type === "ALL_USERS" && b.type !== "ALL_USERS") {
              return 1;
            }
            if (a.type !== "ALL_USERS" && b.type === "ALL_USERS") {
              return -1;
            }

            // groups with permissions show first
            if (a.hasPermissions && !b.hasPermissions) {
              return -1;
            }
            if (!a.hasPermissions && b.hasPermissions) {
              return 1;
            }

            // then sort by name
            if (a.name && b.name) {
              return a.name.localeCompare(b.name);
            }

            // if all is the same it doesn't matter the order
            return 0;
          });
          return (
            <EnumerateList
              values={groups}
              maxItems={2}
              renderItem={({ value }, index) => {
                return (
                  <Text key={index} as="span" whiteSpace="nowrap">
                    {value.hasPermissions ? <KeyIcon marginEnd={1} marginBottom={0.5} /> : null}
                    <LocalizableUserTextRender value={value.localizableName} default={value.name} />
                  </Text>
                );
              }}
              renderOther={({ children, remaining }) => {
                return (
                  <SmallPopover
                    id="other-groups"
                    width="auto"
                    content={
                      <Stack width="auto" spacing={1}>
                        {remaining
                          .sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 1))
                          .map((userGroup, index) => {
                            return (
                              <Text key={index} as="span" whiteSpace="nowrap">
                                {userGroup.hasPermissions ? (
                                  <KeyIcon marginEnd={1} marginBottom={0.5} />
                                ) : (
                                  <UsersIcon marginEnd={1} marginBottom={0.5} />
                                )}
                                <LocalizableUserTextRender
                                  value={userGroup.localizableName}
                                  default={userGroup.name}
                                />
                              </Text>
                            );
                          })}
                      </Stack>
                    }
                    placement="bottom"
                  >
                    <NormalLink as="span" whiteSpace="nowrap">
                      {children}
                    </NormalLink>
                  </SmallPopover>
                );
              }}
            />
          );
        },
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

OrganizationUsers.fragments = {
  get User() {
    return gql`
      fragment OrganizationUsers_User on User {
        id
        ...UserReference_User
        email
        isOrgOwner
        createdAt
        lastActiveAt
        status
        isSsoUser
        userGroups {
          id
          hasPermissions
          name
          localizableName
        }
        ...useCreateOrUpdateUserDialog_User
        ...useConfirmDeactivateUserDialog_User
      }
      ${UserReference.fragments.User}
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
      $locale: UserLocale!
      $userGroupIds: [GID!]
    ) {
      inviteUserToOrganization(
        email: $email
        firstName: $firstName
        lastName: $lastName
        locale: $locale
        userGroupIds: $userGroupIds
      ) {
        ...OrganizationUsers_User
      }
    }
    ${OrganizationUsers.fragments.User}
  `,
  gql`
    mutation OrganizationUsers_updateUserGroupMembership($userId: GID!, $userGroupIds: [GID!]!) {
      updateUserGroupMembership(userId: $userId, userGroupIds: $userGroupIds) {
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
          hasUserProvisioning: hasIntegration(integration: USER_PROVISIONING)
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
      $filters: UserFilter
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
            filters: $filters
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
