import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Box,
  Circle,
  Flex,
  FormControl,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import { ChevronDownIcon, DeleteIcon, UserArrowIcon, UsersIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { UserGroupReference } from "@parallel/components/common/UserGroupReference";
import { UserReference } from "@parallel/components/common/UserReference";

import { UserGroupMembersPopover } from "@parallel/components/common/UserGroupMembersPopover";
import { Avatar, Button, Text } from "@parallel/components/ui";
import {
  DashboardPermissionType,
  DashboardSharingDialog_createDashboardPermissionsDocument,
  DashboardSharingDialog_DashboardQueryDocument,
  DashboardSharingDialog_deleteDashboardPermissionDocument,
  DashboardSharingDialog_updateDashboardPermissionDocument,
  DashboardSharingDialog_UserFragment,
  DashboardSharingDialog_UserGroupFragment,
} from "@parallel/graphql/__types";
import { never } from "@parallel/utils/never";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { ReactNode, useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { useSearchUsers } from "../../../utils/useSearchUsers";
import { UserAvatar } from "../../common/UserAvatar";
import { UserSelect, UserSelectInstance, UserSelectSelection } from "../../common/UserSelect";

interface DashboardSharingDialogData {
  selection: UserSelectSelection<true>[];
  permissionType: "READ" | "WRITE";
}

export function useDashboardSharingDialog() {
  return useDialog(DashboardSharingDialog);
}

export function DashboardSharingDialog({
  dashboardId,
  userId,
  ...props
}: DialogProps<{ dashboardId: string; userId: string }, { lostAccess?: boolean }>) {
  const intl = useIntl();

  const { data, refetch } = useQuery(DashboardSharingDialog_DashboardQueryDocument, {
    variables: { id: dashboardId },
  });

  const dashboard = data?.dashboard;

  const { handleSubmit, control, watch, setValue } = useForm<DashboardSharingDialogData>({
    mode: "onChange",
    defaultValues: {
      selection: [],
      permissionType: "WRITE",
    },
  });

  const userPermissions = (dashboard?.permissions ?? [])
    .filter((p) => isNonNullish(p.user))
    .map((p) => ({ ...p, user: p.user! }));
  const groupPermissions = (dashboard?.permissions ?? [])
    .filter((p) => isNonNullish(p.userGroup))
    .map((p) => ({ ...p, userGroup: p.userGroup! }));

  const hasUsers = watch("selection").length;

  const usersRef = useRef<UserSelectInstance<true, true>>(null);

  const usersToExclude = userPermissions.map((p) => p.user.id);
  const groupsToExclude = groupPermissions.map((p) => p.userGroup.id);

  const searchUsers = useSearchUsers();
  const searchUserGroups = useSearchUserGroups();

  const handleSearchUsersAndGroups = useCallback(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      const [users, groups] = await Promise.all([
        searchUsers(search, { excludeIds: [...excludeUsers, ...usersToExclude] }),
        searchUserGroups(search, {
          excludeIds: [...excludeUserGroups, ...groupsToExclude],
        }),
      ]);

      return [...groups, ...users];
    },
    [searchUsers, searchUserGroups, usersToExclude.join(","), groupsToExclude.join(",")],
  );

  const permissionTypeOptions = useSimpleSelectOptions(
    (intl) => [
      {
        label: intl.formatMessage({
          id: "generic.dashboard-permission-type-write",
          defaultMessage: "Editor",
        }),
        value: "WRITE",
      },
      {
        label: intl.formatMessage({
          id: "generic.dashboard-permission-type-reader",
          defaultMessage: "Reader",
        }),
        value: "READ",
      },
    ],

    [],
  );

  const toast = useToast();
  const showConfirmUpdateDashboardPermission = useDialog(ConfirmUpdateDashboardPermissionDialog);
  const showConfirmStopSharingDashboard = useDialog(ConfirmStopSharingDashboardDialog);

  const [createDashboardPermissions] = useMutation(
    DashboardSharingDialog_createDashboardPermissionsDocument,
  );
  const [updateDashboardPermission] = useMutation(
    DashboardSharingDialog_updateDashboardPermissionDocument,
  );
  const [deleteDashboardPermission] = useMutation(
    DashboardSharingDialog_deleteDashboardPermissionDocument,
  );

  const handleUpdatePermissionClick = async ({
    permissionId,
    newPermissionType,
    isOwnPermission,
  }: {
    permissionId: string;
    newPermissionType: "READ" | "WRITE";
    isOwnPermission: boolean;
  }) => {
    try {
      // if updating this permission results in user having a READ effective permission, show a confirmation dialog as they will lose the ability to edit
      const myOtherPermissions = dashboard?.permissions.filter(
        (p) => p.id !== permissionId && (p.user?.id === userId || p.userGroup?.imMember),
      );

      if (
        isOwnPermission &&
        newPermissionType === "READ" &&
        myOtherPermissions?.every((p) => p.type === "READ")
      ) {
        await showConfirmUpdateDashboardPermission({ type: "update" });
      }

      await updateDashboardPermission({
        variables: {
          dashboardId,
          permissionId,
          newPermissionType,
        },
      });
    } catch {}
  };

  const handleRemovePermissionClick = async ({
    permissionId,
    user,
    userGroup,
    isOwnPermission,
  }: {
    permissionId: string;
    user?: DashboardSharingDialog_UserFragment;
    userGroup?: DashboardSharingDialog_UserGroupFragment;
    isOwnPermission: boolean;
  }) => {
    try {
      let lostAccess = false;
      const name = user ? (
        <UserReference user={user} />
      ) : userGroup ? (
        <UserGroupReference userGroup={userGroup} />
      ) : (
        never()
      );

      const myOtherPermissions = dashboard?.permissions.filter(
        (p) => p.id !== permissionId && (p.user?.id === userId || p.userGroup?.imMember),
      );

      if (isOwnPermission && myOtherPermissions?.length === 0) {
        await showConfirmUpdateDashboardPermission({ type: "delete" });
        lostAccess = true;
      } else if (!isOwnPermission) {
        await showConfirmStopSharingDashboard({ name });
      }
      await deleteDashboardPermission({
        variables: { dashboardId, permissionId },
      });
      if (lostAccess) {
        props.onResolve({ lostAccess });
      } else {
        await refetch();
      }
    } catch {}
  };

  return (
    <ConfirmDialog
      size="xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      initialFocusRef={usersRef}
      hasCloseButton
      {...props}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            if (!hasUsers) {
              props.onResolve();
              return;
            }

            const userIds = data.selection.filter((s) => s.__typename === "User").map((u) => u.id);
            const userGroupIds = data.selection
              .filter((s) => s.__typename === "UserGroup")
              .map((g) => g.id);

            await createDashboardPermissions({
              variables: {
                dashboardId,
                permissionType: data.permissionType,
                userIds,
                userGroupIds,
              },
            });

            setValue("selection", []);
            toast({
              title: intl.formatMessage({
                id: "component.dashboard-sharing-dialog.sharing-success-title",
                defaultMessage: "Dashboard shared successfully",
              }),
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          }),
        },
      }}
      header={
        <Stack direction="row">
          <Circle role="presentation" size="32px" backgroundColor="primary.500" color="white">
            <UserArrowIcon />
          </Circle>
          <Text as="div" flex="1">
            <FormattedMessage
              id="component.dashboard-sharing-dialog.header"
              defaultMessage="Share with people and teams"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack>
          <Flex>
            <FormControl id="selection" flex="1 1 auto" minWidth={0} width="auto">
              <Controller
                name="selection"
                control={control}
                rules={{ minLength: 1 }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <UserSelect
                    data-testid="share-dashboard-select"
                    isMulti
                    includeGroups
                    ref={usersRef}
                    value={value}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                        e.preventDefault();
                      }
                    }}
                    onChange={onChange}
                    onBlur={onBlur}
                    onSearch={handleSearchUsersAndGroups}
                    isDisabled={dashboard?.myEffectivePermission === "READ"}
                    placeholder={
                      dashboard?.myEffectivePermission === "READ"
                        ? intl.formatMessage({
                            id: "component.dashboard-sharing-dialog.input-placeholder-not-allowed",
                            defaultMessage: "Only the dashboard editors can share it",
                          })
                        : undefined
                    }
                  />
                )}
              />
            </FormControl>
            <FormControl id="permissionType" minWidth="120px" width="120px" marginStart={2}>
              <Controller
                name="permissionType"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <SimpleSelect
                    options={permissionTypeOptions}
                    value={value}
                    onChange={onChange}
                    isDisabled={dashboard?.myEffectivePermission === "READ"}
                  />
                )}
              />
            </FormControl>
          </Flex>
          <Stack paddingTop={2}>
            {userPermissions.map(({ id: permissionId, user, type: permissionType }) => (
              <Flex key={user.id} alignItems="center">
                <UserAvatar role="presentation" user={user} size="sm" />
                <Box flex="1" minWidth={0} fontSize="sm" marginStart={2}>
                  <Flex direction="row" alignItems="center" gap={1}>
                    <Text lineClamp={1} wordBreak="break-all">
                      {user.fullName}
                    </Text>
                    {userId === user.id ? (
                      <Text as="span">
                        {"("}
                        <FormattedMessage id="generic.you" defaultMessage="You" />
                        {")"}
                      </Text>
                    ) : null}
                  </Flex>
                  <Text color="gray.500" lineClamp={1}>
                    {user.email}
                  </Text>
                </Box>
                {permissionType === "OWNER" || dashboard?.myEffectivePermission === "READ" ? (
                  <Box
                    paddingX={3}
                    fontWeight="bold"
                    fontStyle="italic"
                    fontSize="sm"
                    color="gray.500"
                    cursor="default"
                  >
                    <DashboardPermissionTypeText type={permissionType} />
                  </Box>
                ) : (
                  <Menu placement="bottom-end">
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      size="sm"
                      rightIcon={<ChevronDownIcon />}
                    >
                      <DashboardPermissionTypeText type={permissionType} />
                    </MenuButton>
                    <MenuList minWidth={40}>
                      <MenuItem
                        isDisabled={permissionType === "WRITE"}
                        onClick={() =>
                          handleUpdatePermissionClick({
                            permissionId,
                            newPermissionType: "WRITE",
                            isOwnPermission: user.id === userId,
                          })
                        }
                      >
                        <DashboardPermissionTypeText type={"WRITE"} />
                      </MenuItem>
                      <MenuItem
                        isDisabled={permissionType === "READ"}
                        onClick={() =>
                          handleUpdatePermissionClick({
                            permissionId,
                            newPermissionType: "READ",
                            isOwnPermission: user.id === userId,
                          })
                        }
                      >
                        <DashboardPermissionTypeText type={"READ"} />
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem
                        color="red.500"
                        onClick={() =>
                          handleRemovePermissionClick({
                            permissionId,
                            user,
                            isOwnPermission: user.id === userId,
                          })
                        }
                      >
                        <FormattedMessage id="generic.remove" defaultMessage="Remove" />
                      </MenuItem>
                    </MenuList>
                  </Menu>
                )}
              </Flex>
            ))}
            {groupPermissions.map(({ id: permissionId, userGroup, type: permissionType }) => {
              return (
                <Flex key={userGroup.id} alignItems="center">
                  <Avatar.Root
                    role="presentation"
                    getInitials={() => userGroup.initials}
                    icon={<UsersIcon />}
                    size="sm"
                  >
                    <Avatar.Fallback name={userGroup.name} />
                  </Avatar.Root>
                  <Box flex="1" minWidth={0} fontSize="sm" marginStart={2}>
                    <Text lineClamp={1} wordBreak="break-all">
                      <UserGroupReference userGroup={userGroup} />
                    </Text>
                    <Flex
                      role="group"
                      flexDirection="row-reverse"
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      <UserGroupMembersPopover userGroupId={userGroup.id}>
                        <Text color="gray.500" cursor="default" lineClamp={1}>
                          <FormattedMessage
                            id="generic.n-group-members"
                            defaultMessage="{count, plural, =1 {1 member} other {# members}}"
                            values={{ count: userGroup.memberCount }}
                          />
                        </Text>
                      </UserGroupMembersPopover>
                    </Flex>
                  </Box>

                  {permissionType === "OWNER" || dashboard?.myEffectivePermission === "READ" ? (
                    <Box
                      paddingX={3}
                      fontWeight="bold"
                      fontStyle="italic"
                      fontSize="sm"
                      color="gray.500"
                      cursor="default"
                    >
                      <DashboardPermissionTypeText type={permissionType} />
                    </Box>
                  ) : (
                    <Menu placement="bottom-end">
                      <MenuButton
                        as={Button}
                        variant="ghost"
                        size="sm"
                        rightIcon={<ChevronDownIcon />}
                      >
                        <DashboardPermissionTypeText type={permissionType} />
                      </MenuButton>
                      <MenuList minWidth={40}>
                        <MenuItem
                          isDisabled={permissionType === "WRITE"}
                          onClick={() =>
                            handleUpdatePermissionClick({
                              permissionId,
                              newPermissionType: "WRITE",
                              isOwnPermission: userGroup.imMember,
                            })
                          }
                        >
                          <DashboardPermissionTypeText type={"WRITE"} />
                        </MenuItem>
                        <MenuItem
                          isDisabled={permissionType === "READ"}
                          onClick={() =>
                            handleUpdatePermissionClick({
                              permissionId,
                              newPermissionType: "READ",
                              isOwnPermission: userGroup.imMember,
                            })
                          }
                        >
                          <DashboardPermissionTypeText type={"READ"} />
                        </MenuItem>
                        <MenuDivider />
                        <MenuItem
                          color="red.500"
                          onClick={() =>
                            handleRemovePermissionClick({
                              permissionId,
                              userGroup,
                              isOwnPermission: userGroup.imMember,
                            })
                          }
                          icon={<DeleteIcon display="block" boxSize={4} />}
                        >
                          <FormattedMessage id="generic.remove" defaultMessage="Remove" />
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  )}
                </Flex>
              );
            })}
          </Stack>
        </Stack>
      }
      confirm={
        hasUsers ? (
          <Button
            data-testid="share-petition-send-button"
            type="submit"
            colorPalette="primary"
            variant="solid"
          >
            <FormattedMessage id="generic.send" defaultMessage="Send" />
          </Button>
        ) : (
          <Button colorPalette="primary" variant="solid" onClick={() => props.onReject()}>
            <FormattedMessage id="generic.done" defaultMessage="Done" />
          </Button>
        )
      }
    />
  );
}

const _fragments = {
  User: gql`
    fragment DashboardSharingDialog_User on User {
      id
      email
      fullName
      ...UserAvatar_User
      ...UserSelect_User
      ...UserReference_User
    }
  `,
  UserGroup: gql`
    fragment DashboardSharingDialog_UserGroup on UserGroup {
      id
      name
      initials
      memberCount
      imMember
      ...UserGroupReference_UserGroup
    }
  `,
  DashboardPermission: gql`
    fragment DashboardSharingDialog_DashboardPermission on DashboardPermission {
      id
      type
      user {
        ...DashboardSharingDialog_User
      }
      userGroup {
        ...DashboardSharingDialog_UserGroup
      }
    }
  `,
  Dashboard: gql`
    fragment DashboardSharingDialog_Dashboard on Dashboard {
      id
      myEffectivePermission
      permissions {
        ...DashboardSharingDialog_DashboardPermission
      }
    }
  `,
};

const _queries = {
  Dashboard: gql`
    query DashboardSharingDialog_DashboardQuery($id: GID!) {
      dashboard(id: $id) {
        ...DashboardSharingDialog_Dashboard
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation DashboardSharingDialog_createDashboardPermissions(
      $dashboardId: GID!
      $userIds: [GID!]
      $userGroupIds: [GID!]
      $permissionType: DashboardPermissionType!
    ) {
      createDashboardPermissions(
        dashboardId: $dashboardId
        userIds: $userIds
        userGroupIds: $userGroupIds
        permissionType: $permissionType
      ) {
        ...DashboardSharingDialog_Dashboard
      }
    }
  `,
  gql`
    mutation DashboardSharingDialog_updateDashboardPermission(
      $dashboardId: GID!
      $permissionId: GID!
      $newPermissionType: DashboardPermissionType!
    ) {
      updateDashboardPermission(
        dashboardId: $dashboardId
        permissionId: $permissionId
        newPermissionType: $newPermissionType
      ) {
        ...DashboardSharingDialog_DashboardPermission
      }
    }
  `,
  gql`
    mutation DashboardSharingDialog_deleteDashboardPermission(
      $dashboardId: GID!
      $permissionId: GID!
    ) {
      deleteDashboardPermission(dashboardId: $dashboardId, permissionId: $permissionId) {
        ...DashboardSharingDialog_Dashboard
      }
    }
  `,
];

function ConfirmUpdateDashboardPermissionDialog({
  type,
  ...props
}: DialogProps<{ type: "update" | "delete" }>) {
  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <FormattedMessage
          id="component.confirm-update-dashboard-permission-dialog.header"
          defaultMessage="Edit permissions"
        />
      }
      body={
        type === "update" ? (
          <FormattedMessage
            id="component.confirm-update-dashboard-permission-dialog.message"
            defaultMessage="Are you sure you want to modify your own permission? If you do you will lose the ability to edit."
          />
        ) : (
          <FormattedMessage
            id="component.confirm-remove-dashboard-permission-dialog.message-own"
            defaultMessage="Are you sure you want to remove your own permission? Doing so will cause you to lose access."
          />
        )
      }
      confirm={
        <Button colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.yes-continue" defaultMessage="Yes, continue" />
        </Button>
      }
      {...props}
    />
  );
}

function ConfirmStopSharingDashboardDialog({ name, ...props }: DialogProps<{ name: ReactNode }>) {
  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <FormattedMessage
          id="component.confirm-stop-sharing-dashboard-dialog.header"
          defaultMessage="Stop sharing"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-stop-sharing-dashboard-dialog.message"
          defaultMessage="Are you sure you want to stop sharing this dashboard with {name}?"
          values={{
            name: <Text as="strong">{name}</Text>,
          }}
        />
      }
      confirm={
        <Button colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-remove-button" defaultMessage="Yes, remove" />
        </Button>
      }
      {...props}
    />
  );
}

function DashboardPermissionTypeText({ type }: { type: DashboardPermissionType }) {
  return (
    <Text as="span">
      {type === "WRITE" ? (
        <FormattedMessage id="generic.dashboard-permission-type-write" defaultMessage="Editor" />
      ) : type === "READ" ? (
        <FormattedMessage id="generic.dashboard-permission-type-reader" defaultMessage="Reader" />
      ) : (
        <FormattedMessage id="generic.dashboard-permission-type-owner" defaultMessage="Owner" />
      )}
    </Text>
  );
}
