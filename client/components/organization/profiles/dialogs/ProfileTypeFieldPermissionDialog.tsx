import { gql, useApolloClient } from "@apollo/client";
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
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import { BusinessIcon, ChevronDownIcon, DeleteIcon, UsersIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AlertPopover } from "@parallel/components/common/AlertPopover";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  SimpleSelect,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { UserAvatar } from "@parallel/components/common/UserAvatar";
import { UserGroupMembersPopover } from "@parallel/components/common/UserGroupMembersPopover";
import { UserGroupReference } from "@parallel/components/common/UserGroupReference";
import { UserSelect, UserSelectInstance } from "@parallel/components/common/UserSelect";
import {
  ProfileTypeFieldPermissionType,
  UpdateProfileTypeFieldPermissionInput,
  useProfileTypeFieldPermissionDialog_ProfileTypeFieldFragment,
  useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermissionFragment,
  useProfileTypeFieldPermissionDialog_UserFragment,
  useProfileTypeFieldPermissionDialog_UserGroupFragment,
  useProfileTypeFieldPermissionDialog_userGroupsDocument,
  useProfileTypeFieldPermissionDialog_usersDocument,
} from "@parallel/graphql/__types";
import { assertTypename, isTypename } from "@parallel/utils/apollo/typename";
import { Focusable } from "@parallel/utils/types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { nanoid } from "nanoid";
import { forwardRef, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
  const { handleSubmit, control, watch, getValues } = useForm<ProfileTypeFieldPermissionDialogData>(
    {
      mode: "onChange",
      defaultValues: {
        permissionType: "WRITE",
        defaultPermission: profileTypeField.defaultPermission,
        permissions: profileTypeField.permissions,
      },
    },
  );

  const defaultPermission = watch("defaultPermission");
  const {
    append,
    update,
    remove,
    fields: permissions,
  } = useFieldArray({ name: "permissions", control });

  const isUsedInProfileName = profileTypeField.isUsedInProfileName;

  const usersRef =
    useRef<
      UserSelectInstance<
        false,
        true,
        | useProfileTypeFieldPermissionDialog_UserFragment
        | useProfileTypeFieldPermissionDialog_UserGroupFragment
      >
    >(null);

  const client = useApolloClient();
  const handleSearchUsers = useDebouncedAsync(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      const { data: usersData } = await client.query({
        query: useProfileTypeFieldPermissionDialog_usersDocument,
        variables: {
          search,
          excludeIds: [
            ...excludeUsers,
            ...permissions
              .map((p) => p.target)
              .filter(isTypename("User"))
              .map((u) => u.id),
          ],
        },
        fetchPolicy: "no-cache",
      });

      const { data: userGroupsData } = await client.query({
        query: useProfileTypeFieldPermissionDialog_userGroupsDocument,
        variables: {
          search,
          excludeIds: [
            ...excludeUserGroups,
            ...permissions
              .map((p) => p.target)
              .filter(isTypename("UserGroup"))
              .map((u) => u.id),
          ],
        },
        fetchPolicy: "no-cache",
      });
      return [...userGroupsData.userGroups.items, ...usersData.me.organization.users.items];
    },
    150,
    [permissions.map((p) => p.target.id).join(",")],
  );

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={usersRef}
      hasCloseButton
      {...props}
      content={{
        as: "form",
        onSubmit: handleSubmit(({ defaultPermission, permissions }) => {
          props.onResolve({
            defaultPermission,
            permissions: permissions.map((p) => {
              return {
                userGroupId: p.target.__typename === "UserGroup" ? p.target.id : undefined,
                userId: p.target.__typename === "User" ? p.target.id : undefined,
                permission: p.permission,
              };
            }),
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
            <Alert status="info" marginBottom={2} rounded="md">
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
              <UserSelect
                includeGroups
                ref={usersRef}
                value={null}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                    e.preventDefault();
                  }
                }}
                onChange={(value) => {
                  append({ id: nanoid(), target: value!, permission: getValues("permissionType") });
                }}
                onSearch={handleSearchUsers}
              />
            </FormControl>
            <FormControl id="permissionType" minWidth="130px" width="auto" marginStart={2}>
              <Controller
                name="permissionType"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <ProfileTypeFieldPermissionTypeSelect
                    value={value}
                    onChange={(value) => onChange(value! as "READ" | "WRITE")}
                  />
                )}
              />
            </FormControl>
          </Flex>
          <Stack paddingTop={2}>
            <Controller
              name="defaultPermission"
              control={control}
              render={({ field: { value, onChange } }) => (
                <HStack alignItems="center" height="42px">
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
            {permissions.map(({ id, target, permission }, index) => (
              <Flex key={id} alignItems="center">
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
                      getInitials={() => (
                        assertTypename(target, "UserGroup"), target.groupInitials
                      )}
                      name={target.name}
                      icon={<UsersIcon />}
                      size="sm"
                    />
                    <Box flex="1" minWidth={0} fontSize="sm" marginStart={2}>
                      <Text noOfLines={1} wordBreak="break-all">
                        <UserGroupReference userGroup={target} />
                      </Text>
                      <Flex>
                        <UserGroupMembersPopover userGroupId={target.id}>
                          <Text color="gray.500" cursor="default" noOfLines={1}>
                            <FormattedMessage
                              id="generic.n-group-members"
                              defaultMessage="{count, plural, =1 {1 member} other {# members}}"
                              values={{ count: target.memberCount }}
                            />
                          </Text>
                        </UserGroupMembersPopover>
                      </Flex>
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
                      {(["WRITE", "READ"] as ProfileTypeFieldPermissionType[]).map((permission) => (
                        <MenuItem
                          key={permission}
                          onClick={() => update(index, { id, target, permission })}
                        >
                          <ProfileTypeFieldPermissionTypeText type={permission} />
                        </MenuItem>
                      ))}
                      <MenuDivider />
                      <MenuItem
                        color="red.500"
                        onClick={() => remove(index)}
                        icon={<DeleteIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage id="generic.remove" defaultMessage="Remove" />
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </Flex>
            ))}
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
  get User() {
    return gql`
      fragment useProfileTypeFieldPermissionDialog_User on User {
        id
        fullName
        email
        ...UserAvatar_User
      }
      ${UserAvatar.fragments.User}
    `;
  },
  get UserGroup() {
    return gql`
      fragment useProfileTypeFieldPermissionDialog_UserGroup on UserGroup {
        id
        name
        groupInitials: initials
        memberCount
        ...UserSelect_UserGroup
        ...UserGroupReference_UserGroup
      }
      ${UserSelect.fragments.UserGroup}
      ${UserGroupReference.fragments.UserGroup}
    `;
  },
  get ProfileTypeFieldPermission() {
    return gql`
      fragment useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermission on ProfileTypeFieldPermission {
        id
        permission
        target {
          ... on User {
            ...useProfileTypeFieldPermissionDialog_User
          }
          ... on UserGroup {
            ...useProfileTypeFieldPermissionDialog_UserGroup
          }
        }
      }
      ${this.User}
      ${this.UserGroup}
    `;
  },
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

const _queries = [
  gql`
    query useProfileTypeFieldPermissionDialog_users($search: String!, $excludeIds: [GID!]) {
      me {
        organization {
          users(
            limit: 100
            offset: 0
            filters: { status: [ACTIVE] }
            search: $search
            exclude: $excludeIds
          ) {
            items {
              ...useProfileTypeFieldPermissionDialog_User
            }
          }
        }
      }
    }
    ${useProfileTypeFieldPermissionDialog.fragments.User}
  `,
  gql`
    query useProfileTypeFieldPermissionDialog_userGroups($search: String!, $excludeIds: [GID!]) {
      userGroups(limit: 100, offset: 0, search: $search, excludeIds: $excludeIds) {
        items {
          ...useProfileTypeFieldPermissionDialog_UserGroup
        }
      }
    }
    ${useProfileTypeFieldPermissionDialog.fragments.UserGroup}
  `,
];

interface ProfileTypeFieldPermissionTypeSelectProps
  extends Omit<SimpleSelectProps<ProfileTypeFieldPermissionType, false>, "options"> {}

const ProfileTypeFieldPermissionTypeSelect = forwardRef<
  Focusable,
  ProfileTypeFieldPermissionTypeSelectProps
>(function ProfileTypeFieldPermissionTypeSelect({ ...props }, ref) {
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
          id="component.profile-type-field-permission-dialog.restricted"
          defaultMessage="Restricted"
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
