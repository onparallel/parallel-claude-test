import { gql } from "@apollo/client";
import { Button, Checkbox, Collapse, Flex, FormControl, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
  useSearchUsers,
} from "@parallel/components/common/UserSelect";
import {
  Maybe,
  TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragment,
  PetitionPermissionType,
  TemplateDefaultPermissionsDialog_PublicPetitionLinkFragment,
  TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment,
  UserOrUserGroupPermissionInput,
  TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragment,
} from "@parallel/graphql/__types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionPermissionTypeSelect } from "../PetitionPermissionType";
import { TemplateDefaultUserGroupPermissionRow } from "./TemplateDefaultUserGroupPermissionRow";
import { TemplateDefaultUserPermissionRow } from "./TemplateDefaultUserPermissionRow";

export interface TemplateDefaultPermissionsDialogProps {
  userId: string;
  permissions: TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment[];
  publicLink?: Maybe<TemplateDefaultPermissionsDialog_PublicPetitionLinkFragment>;
  onUpdatePermissions: (
    v: UserOrUserGroupPermissionInput[]
  ) => Promise<TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment[]>;
}

export function TemplateDefaultPermissionsDialog({
  userId,
  permissions,
  publicLink,
  onUpdatePermissions,
  ...props
}: DialogProps<TemplateDefaultPermissionsDialogProps>) {
  const intl = useIntl();

  const editorsRef = useRef<UserSelectInstance<true, true>>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionsList, setPermissionsList] = useState(permissions);
  const { handleSubmit, register, watch, control, setValue } = useForm<{
    editors: UserSelectSelection<true>[];
    permissionType: PetitionPermissionType;
    isSubscribed: boolean;
  }>({
    mode: "onSubmit",
    defaultValues: {
      editors: [],
      isSubscribed: false,
      permissionType: "WRITE",
    },
  });
  const editors = watch("editors");

  useEffect(() => {
    if (editors.length > 1 || editors[0]?.__typename === "UserGroup") {
      setValue("permissionType", "WRITE");
    }
  }, [editors.length]);

  const ownerPermission = permissionsList.find((p) => p.permissionType === "OWNER") as
    | TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragment
    | undefined;
  const userPermissions = permissionsList.filter(
    (p) => p.__typename === "TemplateDefaultUserPermission" && p.permissionType !== "OWNER"
  ) as TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragment[];

  const groupPermissions = permissionsList.filter(
    (p) => p.__typename === "TemplateDefaultUserGroupPermission"
  ) as TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragment[];

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      return await _handleSearchUsers(search, {
        excludeUsers: [
          // if there is an active public link, exclude the owner of that link from the search
          ...(publicLink?.isActive && !!publicLink.owner
            ? excludeUsers.concat(publicLink.owner.id)
            : excludeUsers),
          ...userPermissions.map((p) => p.user.id),
        ],
        excludeUserGroups: [...excludeUserGroups, ...groupPermissions.map((p) => p.group.id)],
        includeGroups: true,
      });
    },
    [_handleSearchUsers, userPermissions.length, groupPermissions.length]
  );

  const handleRemovePermission = async (templateDefaultPermissionId: string) => {
    const newPermissions = await onUpdatePermissions(
      permissionsList
        .filter((p) => p.id !== templateDefaultPermissionId)
        .map((p) => ({
          isSubscribed: p.isSubscribed,
          permissionType: p.permissionType,
          ...(p.__typename === "TemplateDefaultUserPermission"
            ? { userId: p.user.id }
            : p.__typename === "TemplateDefaultUserGroupPermission"
            ? { userGroupId: p.group.id }
            : (null as never)),
        }))
    );
    setPermissionsList(newPermissions);
  };

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(async ({ editors, isSubscribed, permissionType }) => {
          if (editors.length === 0) {
            props.onResolve();
          } else {
            try {
              setIsSubmitting(true);
              const newPermissions = await onUpdatePermissions(
                editors
                  .map((x) => ({
                    isSubscribed,
                    permissionType,
                    ...(x.__typename === "User"
                      ? { userId: x.id }
                      : x.__typename === "UserGroup"
                      ? { userGroupId: x.id }
                      : (null as never)),
                  }))
                  .concat(
                    permissionsList.map((p) => ({
                      isSubscribed: p.isSubscribed,
                      permissionType: p.permissionType,
                      ...(p.__typename === "TemplateDefaultUserPermission"
                        ? { userId: p.user.id }
                        : p.__typename === "TemplateDefaultUserGroupPermission"
                        ? { userGroupId: p.group.id }
                        : (null as never)),
                    }))
                  ) as any
              );
              setPermissionsList(newPermissions);
              setValue("editors", []);
            } catch {}
            setIsSubmitting(false);
          }
        }),
      }}
      initialFocusRef={editorsRef}
      header={
        <Text>
          <FormattedMessage
            id="component.petition-settings.share-automatically"
            defaultMessage="Assign automatically to"
          />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.template-default-permissions-dialog.description"
              defaultMessage="Upon using this template, petitions will automatically be assigned to these users."
            />
          </Text>
          <Flex>
            <FormControl id="editors">
              <Controller
                name="editors"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <UserSelect
                    ref={editorsRef}
                    isMulti
                    includeGroups
                    value={value}
                    onChange={(users) => onChange(users)}
                    onBlur={onBlur}
                    onSearch={handleSearchUsers}
                    placeholder={intl.formatMessage({
                      id: "generic.petition-sharing-placeholder",
                      defaultMessage: "Add users and teams from your organization",
                    })}
                  />
                )}
              />
            </FormControl>
            <FormControl id="permissionType" width="180px" marginLeft={2}>
              <Controller
                name="permissionType"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <PetitionPermissionTypeSelect
                    permissionType={value}
                    onPermissionChange={onChange}
                    disableOwner={editors.length > 1 || editors[0]?.__typename === "UserGroup"}
                  />
                )}
              />
            </FormControl>
          </Flex>
          <Collapse in={editors.length > 0}>
            <FormControl id="is-subscribed">
              <Checkbox {...register("isSubscribed")}>
                <Flex alignItems="center">
                  <Text as="span">
                    <FormattedMessage
                      id="component.template-default-permissions-dialog.subscribe"
                      defaultMessage="Subscribe to notifications"
                    />
                  </Text>
                  <HelpPopover>
                    <FormattedMessage
                      id="component.template-default-permissions-dialog.subscribe-explanation"
                      defaultMessage="These users will be receive notifications from the petitions created from this template."
                    />
                  </HelpPopover>
                </Flex>
              </Checkbox>
            </FormControl>
          </Collapse>
          <Stack>
            <TemplateDefaultUserPermissionRow
              user={ownerPermission?.user}
              permissionType="OWNER"
              userId={userId}
            />
            {userPermissions.map((p, key) => (
              <TemplateDefaultUserPermissionRow
                key={key}
                user={p.user}
                permissionType={p.permissionType}
                userId={userId}
              />
            ))}
            {groupPermissions.map((p, key) => (
              <TemplateDefaultUserGroupPermissionRow key={key} permission={p} />
            ))}
          </Stack>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid" isLoading={isSubmitting}>
          {editors.length > 0 ? (
            <FormattedMessage id="generic.add" defaultMessage="Add" />
          ) : (
            <FormattedMessage id="generic.ok" defaultMessage="OK" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

TemplateDefaultPermissionsDialog.fragments = {
  PublicPetitionLink: gql`
    fragment TemplateDefaultPermissionsDialog_PublicPetitionLink on PublicPetitionLink {
      isActive
      owner {
        id
        ...TemplateDefaultUserPermissionRow_User
      }
    }
    ${TemplateDefaultUserPermissionRow.fragments.User}
  `,
  TemplateDefaultPermission: gql`
    fragment TemplateDefaultPermissionsDialog_TemplateDefaultPermission on TemplateDefaultPermission {
      id
      isSubscribed
      permissionType
      ... on TemplateDefaultUserPermission {
        ...TemplateDefaultUserPermissionRow_TemplateDefaultUserPermission
      }
      ... on TemplateDefaultUserGroupPermission {
        ...TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermission
      }
    }
    ${TemplateDefaultUserPermissionRow.fragments.TemplateDefaultUserPermission}
    ${TemplateDefaultUserGroupPermissionRow.fragments.TemplateDefaultUserGroupPermission}
  `,
};

export function useTemplateDefaultPermissionsDialog() {
  return useDialog(TemplateDefaultPermissionsDialog);
}
