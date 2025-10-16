import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Button,
  Center,
  Checkbox,
  Flex,
  FormControl,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
} from "@parallel/components/common/UserSelect";
import {
  PetitionPermissionType,
  PetitionPermissionTypeRW,
  TemplateDefaultPermissionsDialog_petitionDocument,
  TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment,
  UserOrUserGroupPermissionInput,
} from "@parallel/graphql/__types";
import { isTypename } from "@parallel/utils/apollo/typename";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { PetitionPermissionTypeSelect } from "../PetitionPermissionTypeSelect";
import { TemplateDefaultUserGroupPermissionRow } from "./TemplateDefaultUserGroupPermissionRow";
import { TemplateDefaultUserPermissionRow } from "./TemplateDefaultUserPermissionRow";

export interface TemplateDefaultPermissionsDialogProps {
  petitionId: string;
  userId: string;
  onUpdatePermissions: (v: UserOrUserGroupPermissionInput[]) => void;
}

export function TemplateDefaultPermissionsDialog({
  petitionId,
  userId,
  onUpdatePermissions,
  ...props
}: DialogProps<TemplateDefaultPermissionsDialogProps>) {
  const { data, loading } = useQuery(TemplateDefaultPermissionsDialog_petitionDocument, {
    variables: { id: petitionId },
  });

  const editorsRef = useRef<UserSelectInstance<true, true>>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultPermissions =
    !loading && data?.petition?.__typename === "PetitionTemplate"
      ? data?.petition.defaultPermissions
      : [];

  const effectiveDefaultPermissions =
    !loading && data?.petition?.__typename === "PetitionTemplate"
      ? data?.petition.effectiveDefaultPermissions
      : [];

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

  const userPermissions = defaultPermissions.filter(isTypename("TemplateDefaultUserPermission"));
  const ownerPermission = userPermissions.find((p) => p.permissionType === "OWNER");
  const nonOwnerUserPermissions = userPermissions.filter((p) => p.permissionType !== "OWNER");

  const groupPermissions = defaultPermissions.filter(
    isTypename("TemplateDefaultUserGroupPermission"),
  );

  useEffect(() => {
    if (!!ownerPermission || editors.length > 1 || editors[0]?.__typename === "UserGroup") {
      setValue("permissionType", "WRITE");
    }
  }, [editors.length, ownerPermission?.id]);

  const searchUsers = useSearchUsers();
  const searchUserGroups = useSearchUserGroups();
  const handleSearchUsersAndGroups = useCallback(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      const excludeUserIds = excludeUsers.slice(0);
      const excludeUserGroupIds = excludeUserGroups.slice(0);
      for (const permission of defaultPermissions) {
        if (permission.__typename === "TemplateDefaultUserPermission") {
          excludeUserIds.push(permission.user.id);
        } else if (permission.__typename === "TemplateDefaultUserGroupPermission") {
          excludeUserGroupIds.push(permission.group.id);
        }
      }

      const [users, groups] = await Promise.all([
        searchUsers(search, { excludeIds: excludeUserIds }),
        searchUserGroups(search, { excludeIds: excludeUserGroupIds }),
      ]);

      return [...groups, ...users];
    },
    [searchUsers, searchUserGroups, defaultPermissions],
  );

  function mapPermission(p: TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment) {
    return {
      isSubscribed: p.isSubscribed,
      permissionType: p.permissionType,
      ...(p.__typename === "TemplateDefaultUserPermission"
        ? { userId: p.user.id }
        : p.__typename === "TemplateDefaultUserGroupPermission"
          ? { userGroupId: p.group.id }
          : (null as never)),
    };
  }

  const handleRemovePermission = async (templateDefaultPermissionId: string) => {
    await onUpdatePermissions(
      defaultPermissions.filter((p) => p.id !== templateDefaultPermissionId).map(mapPermission),
    );
  };

  const handleTransferOwnership = async (templateDefaultPermissionId: string) => {
    const oldOwner = defaultPermissions.find((p) => p.permissionType === "OWNER");
    const newOwner = defaultPermissions.find((p) => p.id === templateDefaultPermissionId)!;

    await onUpdatePermissions(
      defaultPermissions
        .map((p) => {
          if (p.id === oldOwner?.id) {
            return { ...p, permissionType: newOwner.permissionType };
          } else if (p.id === newOwner.id) {
            return { ...p, permissionType: "OWNER" } as const;
          } else {
            return p;
          }
        })
        .map(mapPermission),
    );
  };

  const handleChangePermission = async (
    templateDefaultPermissionId: string,
    permissionType: PetitionPermissionTypeRW,
  ) => {
    await onUpdatePermissions(
      defaultPermissions
        .map((p) => {
          if (p.id === templateDefaultPermissionId) {
            return { ...p, permissionType } as const;
          } else {
            return p;
          }
        })
        .map(mapPermission),
    );
  };

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ editors, isSubscribed, permissionType }) => {
            if (editors.length === 0) {
              props.onResolve();
            } else {
              try {
                setIsSubmitting(true);
                await onUpdatePermissions(
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
                    .concat(defaultPermissions.map(mapPermission)),
                );
                setValue("editors", []);
              } catch {}
              setIsSubmitting(false);
            }
          }),
        },
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
        loading ? (
          <Center height="144px">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Center>
        ) : (
          <Stack spacing={4}>
            <Text>
              <FormattedMessage
                id="component.template-default-permissions-dialog.description"
                defaultMessage="Upon using this template, parallels will automatically be assigned to these users."
              />
            </Text>
            <Flex>
              <FormControl id="editors" flex="1 1 auto" minWidth={0} width="auto">
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
                      onSearch={handleSearchUsersAndGroups}
                    />
                  )}
                />
              </FormControl>
              <FormControl id="permissionType" width="180px" marginStart={2}>
                <Controller
                  name="permissionType"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <PetitionPermissionTypeSelect
                      value={value}
                      onChange={(value) => onChange(value!)}
                      disableOwner={
                        !!ownerPermission ||
                        editors.length > 1 ||
                        editors[0]?.__typename === "UserGroup"
                      }
                    />
                  )}
                />
              </FormControl>
            </Flex>
            <PaddedCollapse open={editors.length > 0}>
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
                        defaultMessage="These users will be receive notifications from the parallels created from this template."
                      />
                    </HelpPopover>
                  </Flex>
                </Checkbox>
              </FormControl>
            </PaddedCollapse>
            <Stack>
              <TemplateDefaultUserPermissionRow
                permission={ownerPermission}
                userId={userId}
                onRemove={() => ownerPermission && handleRemovePermission(ownerPermission.id)}
                onChange={handleChangePermission}
              />
              {nonOwnerUserPermissions.map((permission, index) => (
                <TemplateDefaultUserPermissionRow
                  key={index}
                  permission={permission}
                  userId={userId}
                  onRemove={() => handleRemovePermission(permission.id)}
                  onTransfer={() => handleTransferOwnership(permission.id)}
                  onChange={handleChangePermission}
                  isSubscribed={effectiveDefaultPermissions.some(
                    (ep) => ep.user.id === permission.user.id && ep.isSubscribed,
                  )}
                />
              ))}
              {groupPermissions.map((permission, index) => (
                <TemplateDefaultUserGroupPermissionRow
                  key={index}
                  permission={permission}
                  onRemove={() => handleRemovePermission(permission.id)}
                  onChange={handleChangePermission}
                />
              ))}
            </Stack>
          </Stack>
        )
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid" isLoading={isSubmitting}>
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
  get TemplateDefaultPermission() {
    return gql`
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
    `;
  },
  get PetitionTemplate() {
    return gql`
      fragment TemplateDefaultPermissionsDialog_PetitionTemplate on PetitionTemplate {
        id
        effectiveDefaultPermissions {
          user {
            id
          }
          isSubscribed
        }
        defaultPermissions {
          ...TemplateDefaultPermissionsDialog_TemplateDefaultPermission
        }
      }
      ${this.TemplateDefaultPermission}
    `;
  },
};

TemplateDefaultPermissionsDialog.queries = [
  gql`
    query TemplateDefaultPermissionsDialog_petition($id: GID!) {
      petition(id: $id) {
        id
        ... on PetitionTemplate {
          ...TemplateDefaultPermissionsDialog_PetitionTemplate
        }
      }
    }
    ${TemplateDefaultPermissionsDialog.fragments.PetitionTemplate}
  `,
];

export function useTemplateDefaultPermissionsDialog() {
  return useDialog(TemplateDefaultPermissionsDialog);
}
