import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  FormControl,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import { BusinessIcon, ChevronDownIcon, DeleteIcon, UsersIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { AlertPopover } from "@parallel/components/common/AlertPopover";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  SimpleSelect,
  SimpleSelectInstance,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { UserAvatar } from "@parallel/components/common/UserAvatar";
import { UserGroupMembersPopover } from "@parallel/components/common/UserGroupMembersPopover";
import { UserGroupReference } from "@parallel/components/common/UserGroupReference";
import { UserSelect, UserSelectInstance } from "@parallel/components/common/UserSelect";
import { Avatar, Box, Button, Flex, HStack, Stack, Text } from "@parallel/components/ui";
import {
  ProfileTypeField,
  ProfileTypeFieldPermissionType,
  UpdateProfileTypeFieldPermissionsInput,
  useProfileTypeFieldPermissionDialog_ProfileTypeFieldFragment,
  useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermissionFragment,
  useProfileTypeFieldPermissionDialog_UserFragment,
  useProfileTypeFieldPermissionDialog_UserGroupFragment,
  useProfileTypeFieldPermissionDialog_userGroupsDocument,
  useProfileTypeFieldPermissionDialog_usersDocument,
} from "@parallel/graphql/__types";
import { assertTypename, isTypename } from "@parallel/utils/apollo/typename";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { nanoid } from "nanoid";
import { RefAttributes, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";

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

function findMinPermission(p: Pick<ProfileTypeField, "defaultPermission">[]) {
  return p.reduce((min, p) => {
    return isAtLeast(p.defaultPermission, min) ? min : p.defaultPermission;
  }, "WRITE" as ProfileTypeFieldPermissionType);
}

interface ProfileTypeFieldPermissionDialogData {
  permissionType: ProfileTypeFieldPermissionType;
  defaultPermission: ProfileTypeFieldPermissionType;
  permissions: useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermissionFragment[];
}

interface ProfileTypeFieldPermissionDialogResult {
  defaultPermission: ProfileTypeFieldPermissionType;
  permissions: UpdateProfileTypeFieldPermissionsInput[];
}

export function useProfileTypeFieldPermissionDialog() {
  return useDialog(ProfileTypeFieldPermissionDialog);
}

export function ProfileTypeFieldPermissionDialog({
  profileTypeFields,
  userId,
  ...props
}: DialogProps<
  {
    profileTypeFields: useProfileTypeFieldPermissionDialog_ProfileTypeFieldFragment[];
    userId: string;
  },
  ProfileTypeFieldPermissionDialogResult
>) {
  const { handleSubmit, control, watch, getValues } = useForm<ProfileTypeFieldPermissionDialogData>(
    {
      mode: "onChange",
      defaultValues: {
        permissionType: "WRITE",
        defaultPermission: findMinPermission(profileTypeFields),
        permissions: profileTypeFields.length === 1 ? profileTypeFields[0].permissions : [],
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

  const isUsedInProfileName = profileTypeFields.some((f) => f.isUsedInProfileName);

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

      assert(
        isNonNullish(userGroupsData),
        "Result data in useProfileTypeFieldPermissionDialog_userGroupsDocument is missing",
      );
      assert(
        isNonNullish(usersData),
        "Result data in useProfileTypeFieldPermissionDialog_usersDocument is missing",
      );

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
        containerProps: {
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
        },
      }}
      header={
        <FormattedMessage
          id="component.profile-type-field-permission-dialog.header"
          defaultMessage="Who can see {count, plural, =1{this property} other {these properties}}"
          values={{ count: profileTypeFields.length }}
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
          {profileTypeFields.length > 1 ? (
            <Alert status="info" marginBottom={2} rounded="md">
              <AlertIcon />
              <AlertDescription>
                <FormattedMessage
                  id="component.profile-type-field-permission-dialog.multiple-fields-selected-warning"
                  defaultMessage="Permissions will be overwritten on all selected properties."
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
                  <Avatar.Root
                    role="presentation"
                    icon={<BusinessIcon boxSize={4} />}
                    size="sm"
                    background="gray.200"
                    color="gray.800"
                  />

                  <Box flex="1" minW={0}>
                    <Text lineClamp={1} fontSize="sm">
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
                      <Text lineClamp={1} wordBreak="break-all">
                        {target.fullName}
                        {userId === target.id ? (
                          <>
                            {" ("}
                            <FormattedMessage id="generic.you" defaultMessage="You" />
                            {")"}
                          </>
                        ) : null}
                      </Text>
                      <Text color="gray.500" lineClamp={1}>
                        {target.email}
                      </Text>
                    </Box>
                  </HStack>
                ) : target.__typename === "UserGroup" ? (
                  <>
                    <Avatar.Root
                      role="presentation"
                      getInitials={() => (
                        assertTypename(target, "UserGroup"), target.groupInitials
                      )}
                      icon={<UsersIcon />}
                      size="sm"
                    >
                      <Avatar.Fallback name={target.name} />
                    </Avatar.Root>
                    <Box flex="1" minWidth={0} fontSize="sm" marginStart={2}>
                      <Text lineClamp={1} wordBreak="break-all">
                        <UserGroupReference userGroup={target} />
                      </Text>
                      <Flex>
                        <UserGroupMembersPopover userGroupId={target.id}>
                          <Text color="gray.500" cursor="default" lineClamp={1}>
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
        <Button type="submit" colorPalette="primary" variant="solid">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
    />
  );
}

const _fragments = {
  User: gql`
    fragment useProfileTypeFieldPermissionDialog_User on User {
      id
      fullName
      email
      ...UserAvatar_User
    }
  `,
  UserGroup: gql`
    fragment useProfileTypeFieldPermissionDialog_UserGroup on UserGroup {
      id
      name
      groupInitials: initials
      memberCount
      ...UserSelect_UserGroup
      ...UserGroupReference_UserGroup
    }
  `,
  ProfileTypeFieldPermission: gql`
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
  `,
  ProfileTypeField: gql`
    fragment useProfileTypeFieldPermissionDialog_ProfileTypeField on ProfileTypeField {
      id
      myPermission
      defaultPermission
      isUsedInProfileName
      permissions {
        ...useProfileTypeFieldPermissionDialog_ProfileTypeFieldPermission
      }
    }
  `,
};

const _queries = [
  gql`
    query useProfileTypeFieldPermissionDialog_users($search: String!, $excludeIds: [GID!]) {
      me {
        id
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
  `,
  gql`
    query useProfileTypeFieldPermissionDialog_userGroups($search: String!, $excludeIds: [GID!]) {
      userGroups(limit: 100, offset: 0, search: $search, excludeIds: $excludeIds) {
        items {
          ...useProfileTypeFieldPermissionDialog_UserGroup
        }
      }
    }
  `,
];

interface ProfileTypeFieldPermissionTypeSelectProps
  extends Omit<SimpleSelectProps<ProfileTypeFieldPermissionType, false>, "options"> {}

function ProfileTypeFieldPermissionTypeSelect(
  props: ProfileTypeFieldPermissionTypeSelectProps &
    RefAttributes<SimpleSelectInstance<ProfileTypeFieldPermissionType, false>>,
) {
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

  return <SimpleSelect options={options} {...props} />;
}

const ProfileTypeFieldPermissionTypeText = chakraComponent<
  "span",
  { type: ProfileTypeFieldPermissionType }
>(function ProfileTypeFieldPermissionTypeText({ ref, type, ...props }) {
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
