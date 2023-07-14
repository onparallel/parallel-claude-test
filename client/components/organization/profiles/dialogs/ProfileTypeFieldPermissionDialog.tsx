import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  HStack,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { BusinessIcon, ChevronDownIcon, DeleteIcon, UsersIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AlertPopover } from "@parallel/components/common/AlertPopover";
import {
  SimpleSelect,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { UserAvatar } from "@parallel/components/common/UserAvatar";
import { UserGroupMembersPopover } from "@parallel/components/common/UserGroupMembersPopover";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
} from "@parallel/components/common/UserSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  ProfileTypeFieldPermissionType,
  UpdateProfileTypeFieldPermissionInput,
  useProfileTypeFieldPermissionDialog_ProfileTypeFieldFragment,
  useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermissionFragment,
} from "@parallel/graphql/__types";
import { Focusable } from "@parallel/utils/types";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { forwardRef, useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

const ProfileTypeFieldPermissionTypeValues = [
  "HIDDEN",
  "READ",
  "WRITE",
] as ProfileTypeFieldPermissionType[];

function isAtLeast(p1: ProfileTypeFieldPermissionType, p2: ProfileTypeFieldPermissionType) {
  return (
    ProfileTypeFieldPermissionTypeValues.indexOf(p1) >=
    ProfileTypeFieldPermissionTypeValues.indexOf(p2)
  );
}

interface ProfileTypeFieldPermissionDialogData {
  selection: UserSelectSelection<true>[];
  permissionType: ProfileTypeFieldPermissionType;
  defaultPermission: ProfileTypeFieldPermissionType;
  permissions: useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermissionFragment[];
}

interface ProfileTypeFieldPermissionDialogResult {
  defaultPermission: ProfileTypeFieldPermissionType;
  permissions: UpdateProfileTypeFieldPermissionInput[];
}

export function useProfileTypeFieldPermissionDialog() {
  return useDialog(ProfileTypeFieldPermissionDialog);
}

export function ProfileTypeFieldPermissionDialog({
  profileTypeField,
  userId,
  ...props
}: DialogProps<
  {
    profileTypeField: useProfileTypeFieldPermissionDialog_ProfileTypeFieldFragment;
    userId: string;
  },
  ProfileTypeFieldPermissionDialogResult
>) {
  const permissions = profileTypeField.permissions;

  const { handleSubmit, control, watch } = useForm<ProfileTypeFieldPermissionDialogData>({
    mode: "onChange",
    defaultValues: {
      selection: [],
      permissionType: "WRITE",
      defaultPermission: profileTypeField.defaultPermission,
      permissions,
    },
  });

  const hasUsers = watch("selection").length;
  const defaultPermission = watch("defaultPermission");
  const isUsedInProfileName = profileTypeField.isUsedInProfileName;

  const usersRef = useRef<UserSelectInstance<true, true>>(null);

  const userPermissions = permissions.filter(({ target }) => target.__typename === "User") ?? [];
  const groupPermissions =
    permissions.filter(({ target }) => target.__typename === "UserGroup") ?? [];

  const usersToExclude = userPermissions.map((p) => p.target.id) ?? [];
  const groupsToExclude = groupPermissions.map((p) => p.target.id) ?? [];

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      return await _handleSearchUsers(search, {
        includeGroups: true,
        excludeUsers: [...excludeUsers, ...usersToExclude],
        excludeUserGroups: [...excludeUserGroups, ...groupsToExclude],
      });
    },
    [_handleSearchUsers, usersToExclude.join(","), groupsToExclude.join(",")],
  );

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={usersRef}
      hasCloseButton
      {...props}
      content={{
        as: "form",
        onSubmit: handleSubmit(({ selection, defaultPermission, permissions, permissionType }) => {
          props.onResolve({
            defaultPermission,
            permissions: [
              ...permissions.map((p) => {
                return {
                  userGroupId: p.target.__typename === "UserGroup" ? p.target.id : undefined,
                  userId: p.target.__typename === "User" ? p.target.id : undefined,
                  permission: p.permission,
                };
              }),
              ...selection.map((s) => {
                return {
                  userGroupId: s.__typename === "UserGroup" ? s.id : undefined,
                  userId: s.__typename === "User" ? s.id : undefined,
                  permission: permissionType,
                };
              }),
            ],
          });
        }),
      }}
      header={
        <FormattedMessage
          id="component.profile-type-field-permission-dialog.header"
          defaultMessage="Who can see this property"
        />
      }
      body={
        <Stack>
          {isUsedInProfileName ? (
            <Alert status="info" marginBottom={2}>
              <AlertIcon />
              <AlertDescription>
                <FormattedMessage
                  id="component.profile-type-field-permission-dialog.used-in-profile-name-warning"
                  defaultMessage="Properties used in the name cannot be hidden."
                />
              </AlertDescription>
            </Alert>
          ) : null}
          <Flex>
            <FormControl id="selection" flex="1 1 auto" minWidth={0} width="auto">
              <Controller
                name="selection"
                control={control}
                rules={{ minLength: 1 }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <UserSelect
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
                    onSearch={handleSearchUsers}
                  />
                )}
              />
            </FormControl>
            {hasUsers ? (
              <FormControl id="permissionType" minWidth="120px" width="120px" marginLeft={2}>
                <Controller
                  name="permissionType"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <ProfileTypeFieldPermissionTypeSelect
                      value={value}
                      onChange={(value) => onChange(value! as "READ" | "WRITE" | "HIDDEN")}
                      isHiddenDisabled={isUsedInProfileName}
                    />
                  )}
                />
              </FormControl>
            ) : null}
          </Flex>
          <Stack paddingTop={2}>
            <Controller
              name="defaultPermission"
              control={control}
              render={({ field: { value, onChange } }) => (
                <HStack alignItems="center">
                  <Avatar
                    role="presentation"
                    icon={<BusinessIcon boxSize={4} />}
                    size="sm"
                    background="gray.200"
                    color="gray.800"
                  />
                  <Box flex="1" minW={0}>
                    <Text noOfLines={1} fontSize="sm">
                      <FormattedMessage
                        id="component.profile-type-field-permission-dialog.all-in-organization"
                        defaultMessage="Everyone in the organization"
                      />
                    </Text>
                  </Box>
                  <Box>
                    <Menu placement="bottom-end">
                      <MenuButton
                        as={Button}
                        variant="ghost"
                        size="sm"
                        rightIcon={<ChevronDownIcon />}
                      >
                        <ProfileTypeFieldPermissionTypeText type={value} />
                      </MenuButton>
                      <MenuList minWidth={40}>
                        <MenuItem onClick={() => onChange("WRITE")}>
                          <ProfileTypeFieldPermissionTypeText type="WRITE" />
                        </MenuItem>
                        <MenuItem onClick={() => onChange("READ")}>
                          <ProfileTypeFieldPermissionTypeText type="READ" />
                        </MenuItem>
                        <MenuItem
                          onClick={() => onChange("HIDDEN")}
                          isDisabled={isUsedInProfileName}
                        >
                          <ProfileTypeFieldPermissionTypeText type="HIDDEN" />
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Box>
                </HStack>
              )}
            />
            <Controller
              name="permissions"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, value } }) => {
                return (
                  <>
                    {value.map(({ permission, target, id }) => (
                      <Flex key={target.id} alignItems="center">
                        {target.__typename === "User" ? (
                          <HStack flex={1}>
                            <UserAvatar role="presentation" user={target} size="sm" />
                            <Box flex="1" minWidth={0} fontSize="sm">
                              <Text noOfLines={1} wordBreak="break-all">
                                {target.fullName}
                                {userId === target.id ? (
                                  <>
                                    {" ("}
                                    <FormattedMessage id="generic.you" defaultMessage="You" />
                                    {")"}
                                  </>
                                ) : null}
                              </Text>
                              <Text color="gray.500" noOfLines={1}>
                                {target.email}
                              </Text>
                            </Box>
                          </HStack>
                        ) : target.__typename === "UserGroup" ? (
                          <>
                            <Avatar
                              role="presentation"
                              getInitials={() => target.groupInitials}
                              name={target.name}
                              size="sm"
                            />
                            <Box flex="1" minWidth={0} fontSize="sm" marginLeft={2}>
                              <HStack align="center">
                                <UsersIcon />
                                <Text noOfLines={1} wordBreak="break-all">
                                  {target.name}
                                </Text>
                              </HStack>
                              <Box>
                                <UserGroupMembersPopover userGroupId={target.id}>
                                  <Text color="gray.500" cursor="default" noOfLines={1}>
                                    <FormattedMessage
                                      id="generic.n-group-members"
                                      defaultMessage="{count, plural, =1 {1 member} other {# members}}"
                                      values={{ count: target.memberCount }}
                                    />
                                  </Text>
                                </UserGroupMembersPopover>
                              </Box>
                            </Box>
                          </>
                        ) : (
                          (null as never)
                        )}
                        <HStack>
                          {isAtLeast(permission, defaultPermission) ? null : (
                            <AlertPopover>
                              <Text>
                                <FormattedMessage
                                  id="component.profile-type-field-permission-dialog.permissions-conflict-popover"
                                  defaultMessage="There is a higher-level permission for everyone in the organization that overrides this one."
                                />
                              </Text>
                            </AlertPopover>
                          )}
                          <Menu placement="bottom-end">
                            <MenuButton
                              as={Button}
                              variant="ghost"
                              size="sm"
                              rightIcon={<ChevronDownIcon />}
                            >
                              <ProfileTypeFieldPermissionTypeText type={permission} />
                            </MenuButton>
                            <MenuList minWidth={40}>
                              {(
                                ["WRITE", "READ", "HIDDEN"] as ProfileTypeFieldPermissionType[]
                              ).map((permission) => (
                                <MenuItem
                                  key={permission}
                                  isDisabled={permission === "HIDDEN" && isUsedInProfileName}
                                  onClick={() =>
                                    onChange(
                                      value.map((p) => (p.id === id ? { ...p, permission } : p)),
                                    )
                                  }
                                >
                                  <ProfileTypeFieldPermissionTypeText type={permission} />
                                </MenuItem>
                              ))}
                              <MenuDivider />
                              <MenuItem
                                color="red.500"
                                onClick={() => onChange(value.filter((p) => p.id !== id))}
                                icon={<DeleteIcon display="block" boxSize={4} />}
                              >
                                <FormattedMessage id="generic.remove" defaultMessage="Remove" />
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Flex>
                    ))}
                  </>
                );
              }}
            />
          </Stack>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
    />
  );
}

useProfileTypeFieldPermissionDialog.fragments = {
  ProfileTypeFieldPermission: gql`
    fragment useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermission on ProfileTypeFieldPermission {
      id
      permission
      target {
        ... on User {
          id
          fullName
          email
          ...UserAvatar_User
        }
        ... on UserGroup {
          id
          name
          groupInitials: initials
          memberCount
        }
      }
    }
    ${UserAvatar.fragments.User}
  `,
  get ProfileTypeField() {
    return gql`
      fragment useProfileTypeFieldPermissionDialog_ProfileTypeField on ProfileTypeField {
        id
        myPermission
        defaultPermission
        isUsedInProfileName
        permissions {
          ...useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermission
        }
      }
      ${this.ProfileTypeFieldPermission}
    `;
  },
};

interface ProfileTypeFieldPermissionTypeSelectProps
  extends Omit<SimpleSelectProps<ProfileTypeFieldPermissionType, false>, "options"> {
  isHiddenDisabled?: boolean;
}

const ProfileTypeFieldPermissionTypeSelect = forwardRef<
  Focusable,
  ProfileTypeFieldPermissionTypeSelectProps
>(function ProfileTypeFieldPermissionTypeSelect({ isHiddenDisabled, ...props }, ref) {
  const options = useSimpleSelectOptions(
    (intl) => [
      {
        label: intl.formatMessage({
          id: "component.profile-type-field-permission-dialog.write",
          defaultMessage: "Can write",
        }),
        value: "WRITE",
      },
      {
        label: intl.formatMessage({
          id: "component.profile-type-field-permission-dialog.read",
          defaultMessage: "Can read",
        }),
        value: "READ",
      },
      {
        label: intl.formatMessage({
          id: "component.profile-type-field-permission-dialog.hidden",
          defaultMessage: "Hidden",
        }),
        value: "HIDDEN",
        isDisabled: isHiddenDisabled,
      },
    ],
    [],
  );

  return <SimpleSelect ref={ref as any} options={options} {...props} />;
});

const ProfileTypeFieldPermissionTypeText = chakraForwardRef<
  "span",
  { type: ProfileTypeFieldPermissionType }
>(function ProfileTypeFieldPermissionTypeText({ type, ...props }, ref) {
  return (
    <Text ref={ref as any} as="span" {...props}>
      {type === "HIDDEN" ? (
        <FormattedMessage
          id="component.profile-type-field-permission-dialog.hidden"
          defaultMessage="Hidden"
        />
      ) : type === "WRITE" ? (
        <FormattedMessage
          id="component.profile-type-field-permission-dialog.write"
          defaultMessage="Can write"
        />
      ) : (
        <FormattedMessage
          id="component.profile-type-field-permission-dialog.read"
          defaultMessage="Can read"
        />
      )}
    </Text>
  );
});
