import { gql, useMutation, useQuery } from "@apollo/client";
import { getOperationName } from "@apollo/client/utilities";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Avatar,
  Box,
  Button,
  Center,
  Checkbox,
  Circle,
  Flex,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Stack,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
import { ChevronDownIcon, DeleteIcon, UserArrowIcon, UsersIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  NewPetition_templatesDocument,
  PetitionActivity_petitionDocument,
  PetitionSharingModal_addPetitionPermissionDocument,
  PetitionSharingModal_petitionsDocument,
  PetitionSharingModal_PetitionUserGroupPermissionFragment,
  PetitionSharingModal_PetitionUserPermissionFragment,
  PetitionSharingModal_removePetitionPermissionDocument,
  PetitionSharingModal_transferPetitionOwnershipDocument,
  PetitionSharingModal_UserFragment,
  PetitionSharingModal_UserGroupFragment,
} from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { Maybe } from "@parallel/utils/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { GrowingTextarea } from "../../common/GrowingTextarea";
import { HelpPopover } from "../../common/HelpPopover";
import { PaddedCollapse } from "../../common/PaddedCollapse";
import { UserAvatar } from "../../common/UserAvatar";
import { UserListPopover } from "../../common/UserListPopover";
import {
  UserSelect,
  UserSelectInstance,
  UserSelectSelection,
  useSearchUsers,
} from "../../common/UserSelect";
import { PetitionPermissionTypeText } from "../PetitionPermissionType";

type PetitionSharingDialogData = {
  selection: UserSelectSelection<true>[];
  notify: boolean;
  subscribe: boolean;
  message: string;
};

type PetitionSharingDialogResult = {
  close?: boolean;
};

export function usePetitionSharingDialog() {
  return useDialog(PetitionSharingDialog);
}

export function PetitionSharingDialog({
  userId,
  petitionIds,
  isTemplate,
  ...props
}: DialogProps<
  {
    userId: string;
    petitionIds: string[];
    isTemplate?: boolean;
  },
  PetitionSharingDialogResult
>) {
  const intl = useIntl();
  const toast = useToast();
  const [hasUsers, setHasUsers] = useState(false);

  const { data, loading } = useQuery(PetitionSharingModal_petitionsDocument, {
    variables: { petitionIds },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (!loading) {
      setTimeout(() => usersRef.current?.focus());
    }
  }, [loading]);

  const petitionId = petitionIds[0];
  const petitionsById = data?.petitionsById;

  const userPermissions = (petitionsById?.[0]?.permissions.filter(
    (p) => p.__typename === "PetitionUserPermission"
  ) ?? []) as PetitionSharingModal_PetitionUserPermissionFragment[];

  const groupPermissions = (petitionsById?.[0]?.permissions.filter(
    (p) => p.__typename === "PetitionUserGroupPermission"
  ) ?? []) as PetitionSharingModal_PetitionUserGroupPermissionFragment[];

  const { handleSubmit, register, control, watch } = useForm<PetitionSharingDialogData>({
    mode: "onChange",
    defaultValues: {
      selection: [],
      notify: true,
      subscribe: true,
      message: "",
    },
  });

  const petitionsOwned =
    petitionsById?.filter((petition) =>
      petition?.permissions.some(
        (up) =>
          up.permissionType === "OWNER" &&
          up.__typename === "PetitionUserPermission" &&
          up.user.id === userId
      )
    ) ?? [];
  const petitionsOwnedWrite =
    petitionsById?.filter((petition) =>
      petition?.permissions.some(
        (up) =>
          up.permissionType !== "READ" &&
          up.__typename === "PetitionUserPermission" &&
          up?.user.id === userId
      )
    ) ?? [];

  const petitionsRead =
    petitionsById?.filter((petition) =>
      petition?.permissions.some(
        (up) =>
          up.permissionType === "READ" &&
          up.__typename === "PetitionUserPermission" &&
          up?.user.id === userId
      )
    ) ?? [];

  const usersRef = useRef<UserSelectInstance<true, true>>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const messageRegisterProps = useRegisterWithRef(messageRef, register, "message");

  const usersToExclude =
    petitionIds.length === 1 ? userPermissions?.map((p) => p.user.id) ?? [] : [userId];

  const groupsToExclude =
    petitionIds.length === 1 ? groupPermissions?.map((p) => p.group.id) ?? [] : [];

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      return await _handleSearchUsers(search, {
        includeGroups: true,
        excludeUsers: [...excludeUsers, ...usersToExclude],
        excludeUserGroups: [...excludeUserGroups, ...groupsToExclude],
      });
    },
    [_handleSearchUsers, usersToExclude.join(","), groupsToExclude.join(",")]
  );

  interface RemovePetitionPermissionProps {
    petitionId: string;
    user?: PetitionSharingModal_UserFragment;
    userGroup?: PetitionSharingModal_UserGroupFragment;
  }

  const confirmRemovePetitionPermission = useDialog(ConfirmRemovePetitionPermissionDialog);
  const [removePetitionPermission] = useMutation(
    PetitionSharingModal_removePetitionPermissionDocument
  );

  const handleRemovePetitionPermission = async ({
    petitionId,
    user,
    userGroup,
  }: RemovePetitionPermissionProps) => {
    try {
      const prop = user ? "userIds" : "userGroupIds";
      const name = user ? user.fullName : userGroup?.name;
      const id = user ? user.id : userGroup?.id;

      await confirmRemovePetitionPermission({ name: id === userId ? undefined : name });
      await removePetitionPermission({
        variables: { petitionId, [prop]: [id] },
        refetchQueries: [
          getOperationName(
            isTemplate ? NewPetition_templatesDocument : PetitionActivity_petitionDocument
          )!,
        ],
        update(client, { data }) {
          const hasPermissions = Boolean(
            data?.removePetitionPermission[0].permissions
              .filter((p) => p.permissionType === "OWNER" || p.permissionType === "WRITE")
              .filter((p) =>
                p.__typename === "PetitionUserPermission" ? p.user.id === userId : true
              ).length
          );
          if (!hasPermissions) {
            client.evict({ id: petitionId });
            client.gc();
            props.onResolve?.({ close: true });
          }
        },
      });
    } catch {}
  };

  const handleTransferPetitionOwnership = useTransferPetitionOwnership();

  const [addPetitionPermission] = useMutation(PetitionSharingModal_addPetitionPermissionDocument);

  const handleAddPetitionPermissions = handleSubmit(
    async ({ selection, notify, subscribe, message }) => {
      const users = selection.filter((s) => s.__typename === "User").map((u) => u.id);
      const groups = selection.filter((s) => s.__typename === "UserGroup").map((g) => g.id);

      try {
        await addPetitionPermission({
          variables: {
            petitionIds: petitionsOwnedWrite.map((p) => p!.id),
            userIds: users.length ? users : null,
            userGroupIds: groups.length ? groups : null,
            permissionType: "WRITE",
            notify,
            subscribe: isTemplate ? false : subscribe,
            message: message || null,
          },
          refetchQueries: [
            getOperationName(
              isTemplate ? NewPetition_templatesDocument : PetitionActivity_petitionDocument
            )!,
          ],
        });
        toast({
          title: getSuccessTitle(),
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        props.onResolve();
      } catch {}
    }
  );

  const getSuccessTitle = () => {
    const template = intl.formatMessage(
      {
        id: "template-sharing.success-title",
        defaultMessage: "{count, plural, =1 {Template} other {Templates}} shared",
      },
      {
        count: petitionsOwnedWrite.length,
      }
    );

    const petition = intl.formatMessage(
      {
        id: "petition-sharing.success-title",
        defaultMessage: "{count, plural, =1 {Petition} other {Petitions}} shared",
      },
      {
        count: petitionsOwnedWrite.length,
      }
    );

    return isTemplate ? template : petition;
  };

  const notify = watch("notify");

  useEffect(() => {
    if (notify) {
      setTimeout(() => messageRef.current?.focus());
    }
  }, [notify]);

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={usersRef}
      hasCloseButton
      {...props}
      content={{ as: "form", onSubmit: handleAddPetitionPermissions }}
      header={
        <Stack direction="row">
          <Circle role="presentation" size="32px" backgroundColor="purple.500" color="white">
            <UserArrowIcon />
          </Circle>
          <Text as="div" flex="1">
            <FormattedMessage
              id="petition-sharing.header"
              defaultMessage="Share with people and teams"
            />
          </Text>
        </Stack>
      }
      body={
        petitionsById ? (
          <Stack>
            <Stack direction="row">
              <Box flex="1">
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
                      onChange={(users) => {
                        onChange(users);
                        setHasUsers(Boolean(users?.length));
                      }}
                      onBlur={onBlur}
                      onSearch={handleSearchUsers}
                      isDisabled={!petitionsOwnedWrite.length}
                      placeholder={
                        petitionsOwnedWrite.length
                          ? undefined
                          : intl.formatMessage({
                              id: "petition-sharing.input-placeholder-not-owner",
                              defaultMessage: "Only the petition owner can share it",
                            })
                      }
                    />
                  )}
                />
              </Box>
              {/* PermissionTypeSelect */}
            </Stack>
            <Stack display={hasUsers ? "flex" : "none"}>
              <Checkbox {...register("notify")} colorScheme="purple" defaultIsChecked>
                <FormattedMessage
                  id="petition-sharing.notify-checkbox"
                  defaultMessage="Notify users"
                />
              </Checkbox>
              <PaddedCollapse in={notify}>
                <GrowingTextarea
                  {...messageRegisterProps}
                  maxHeight="30vh"
                  aria-label={intl.formatMessage({
                    id: "petition-sharing.message-placeholder",
                    defaultMessage: "Message",
                  })}
                  placeholder={intl.formatMessage({
                    id: "petition-sharing.message-placeholder",
                    defaultMessage: "Message",
                  })}
                />
              </PaddedCollapse>
              {!isTemplate ? (
                <Checkbox {...register("subscribe")} colorScheme="purple" defaultIsChecked>
                  <FormattedMessage
                    id="component.petition-sharing-dialog.subscribe"
                    defaultMessage="Subscribe to notifications"
                  />
                  <HelpPopover>
                    <FormattedMessage
                      id="component.petition-sharing-dialog.subscribe-help"
                      defaultMessage="Users will receive notifications about the activity of this petition."
                    />
                  </HelpPopover>
                </Checkbox>
              ) : null}
            </Stack>
            <Stack display={hasUsers || petitionIds.length !== 1 ? "none" : "flex"} paddingTop={2}>
              {userPermissions?.map(({ user, permissionType }) => (
                <Flex key={user.id} alignItems="center">
                  <UserAvatar role="presentation" user={user} size="sm" />
                  <Box flex="1" minWidth={0} fontSize="sm" marginLeft={2}>
                    <Text isTruncated>
                      {user.fullName}{" "}
                      {userId === user.id ? (
                        <Text as="span">
                          {"("}
                          <FormattedMessage id="generic.you" defaultMessage="You" />
                          {")"}
                        </Text>
                      ) : null}
                    </Text>
                    <Text color="gray.500" isTruncated>
                      {user.email}
                    </Text>
                  </Box>
                  {permissionType === "OWNER" ? (
                    <Box
                      paddingX={3}
                      fontWeight="bold"
                      fontStyle="italic"
                      fontSize="sm"
                      color="gray.500"
                      cursor="default"
                    >
                      <PetitionPermissionTypeText type={permissionType} />
                    </Box>
                  ) : (
                    <Menu placement="bottom-end">
                      <MenuButton
                        as={Button}
                        variant="ghost"
                        size="sm"
                        rightIcon={<ChevronDownIcon />}
                      >
                        <PetitionPermissionTypeText type="WRITE" />
                      </MenuButton>
                      <MenuList minWidth={40}>
                        <MenuItem
                          onClick={() => handleTransferPetitionOwnership(petitionId, user)}
                          icon={<UserArrowIcon display="block" boxSize={4} />}
                          isDisabled={!petitionsOwned.length}
                        >
                          <FormattedMessage
                            id="generic.transfer-ownership"
                            defaultMessage="Transfer ownership"
                          />
                        </MenuItem>
                        <MenuItem
                          color="red.500"
                          onClick={() =>
                            handleRemovePetitionPermission({
                              petitionId,
                              user,
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
              ))}
              {groupPermissions.map(({ group, permissionType }) => {
                return (
                  <Flex key={group.id} alignItems="center">
                    <Avatar
                      role="presentation"
                      getInitials={() => group.initials}
                      name={group.name!}
                      size="sm"
                    />
                    <Box flex="1" minWidth={0} fontSize="sm" marginLeft={2}>
                      <Stack direction={"row"} spacing={2} align="center">
                        <UsersIcon />
                        <Text isTruncated>{group.name} </Text>
                      </Stack>
                      <Flex
                        role="group"
                        flexDirection="row-reverse"
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        <UserListPopover usersOrGroups={group.members.map((m) => m.user)}>
                          <Text color="gray.500" isTruncated>
                            <FormattedMessage
                              id="component.user-select.group-members"
                              defaultMessage="{count, plural, =1 {1 member} other {# members}}"
                              values={{ count: group.members.length }}
                            />
                          </Text>
                        </UserListPopover>
                      </Flex>
                    </Box>
                    {permissionType === "READ" ? (
                      <Box
                        paddingX={3}
                        fontWeight="bold"
                        fontStyle="italic"
                        fontSize="sm"
                        color="gray.500"
                        cursor="default"
                      >
                        <PetitionPermissionTypeText type={permissionType} />
                      </Box>
                    ) : (
                      <Menu placement="bottom-end">
                        <MenuButton
                          as={Button}
                          variant="ghost"
                          size="sm"
                          rightIcon={<ChevronDownIcon />}
                        >
                          <PetitionPermissionTypeText type="WRITE" />
                        </MenuButton>
                        <MenuList minWidth={40}>
                          <MenuItem
                            color="red.500"
                            onClick={() =>
                              handleRemovePetitionPermission({
                                petitionId,
                                userGroup: group,
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
            <Stack display={petitionsRead.length && petitionIds.length !== 1 ? "flex" : "none"}>
              <Alert status="warning" backgroundColor="orange.100" borderRadius="md">
                <Flex alignItems="center" justifyContent="flex-start">
                  <AlertIcon color="yellow.500" />
                  <AlertDescription>
                    {petitionsRead.length !== petitionIds.length ? (
                      <>
                        <Text>
                          {isTemplate ? (
                            <FormattedMessage
                              id="template-sharing.insufficient-permissions-list"
                              defaultMessage="The following {count, plural, =1 {template has} other {templates have}} been ignored and cannot be shared due to lack of permissions:"
                              values={{ count: petitionsRead.length }}
                            />
                          ) : (
                            <FormattedMessage
                              id="petition-sharing.insufficient-permissions-list"
                              defaultMessage="The following {count, plural, =1 {petition has} other {petitions have}} been ignored and cannot be shared due to lack of permissions:"
                              values={{ count: petitionsRead.length }}
                            />
                          )}
                        </Text>
                        <UnorderedList paddingLeft={2}>
                          {petitionsRead.map((petition) => (
                            <ListItem key={petition!.id}>
                              <Text as="span" textStyle={petition!.name ? undefined : "hint"}>
                                {petition?.name ??
                                  intl.formatMessage({
                                    id: "generic.unnamed-petition",
                                    defaultMessage: "Unnamed petition",
                                  })}
                              </Text>
                            </ListItem>
                          ))}
                        </UnorderedList>
                      </>
                    ) : (
                      <Text>
                        {isTemplate ? (
                          <FormattedMessage
                            id="template-sharing.insufficient-permissions"
                            defaultMessage="You do not have permission to share the selected templates."
                          />
                        ) : (
                          <FormattedMessage
                            id="petition-sharing.insufficient-permissions"
                            defaultMessage="You do not have permission to share the selected petitions."
                          />
                        )}
                      </Text>
                    )}
                  </AlertDescription>
                </Flex>
              </Alert>
            </Stack>
          </Stack>
        ) : (
          <Center minHeight={64}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="purple.500"
              size="xl"
            />
          </Center>
        )
      }
      confirm={
        hasUsers ? (
          <Button type="submit" colorScheme="purple" variant="solid">
            <FormattedMessage id="generic.send" defaultMessage="Send" />
          </Button>
        ) : (
          <Button colorScheme="purple" variant="solid" onClick={() => props.onReject()}>
            <FormattedMessage id="generic.done" defaultMessage="Done" />
          </Button>
        )
      }
    />
  );
}

PetitionSharingDialog.fragments = {
  get Petition() {
    return gql`
      fragment PetitionSharingModal_Petition on PetitionBase {
        id
        name
        permissions {
          ... on PetitionUserPermission {
            ...PetitionSharingModal_PetitionUserPermission
          }
          ... on PetitionUserGroupPermission {
            ...PetitionSharingModal_PetitionUserGroupPermission
          }
        }
      }
      ${this.PetitionUserPermission}
      ${this.PetitionUserGroupPermission}
    `;
  },
  get PetitionUserPermission() {
    return gql`
      fragment PetitionSharingModal_PetitionUserPermission on PetitionUserPermission {
        permissionType
        user {
          ...PetitionSharingModal_User
        }
      }
      ${this.User}
    `;
  },
  get PetitionUserGroupPermission() {
    return gql`
      fragment PetitionSharingModal_PetitionUserGroupPermission on PetitionUserGroupPermission {
        permissionType
        group {
          ...PetitionSharingModal_UserGroup
        }
      }
      ${this.UserGroup}
    `;
  },
  get User() {
    return gql`
      fragment PetitionSharingModal_User on User {
        id
        email
        fullName
        ...UserAvatar_User
        ...UserSelect_User
      }
      ${UserSelect.fragments.User}
      ${UserAvatar.fragments.User}
    `;
  },
  get UserGroup() {
    return gql`
      fragment PetitionSharingModal_UserGroup on UserGroup {
        id
        name
        initials
        members {
          user {
            ...PetitionSharingModal_User
          }
        }
      }
      ${this.User}
    `;
  },
};

PetitionSharingDialog.mutations = [
  gql`
    mutation PetitionSharingModal_addPetitionPermission(
      $petitionIds: [GID!]!
      $userIds: [GID!]
      $userGroupIds: [GID!]
      $permissionType: PetitionPermissionTypeRW!
      $notify: Boolean
      $subscribe: Boolean
      $message: String
    ) {
      addPetitionPermission(
        petitionIds: $petitionIds
        userIds: $userIds
        userGroupIds: $userGroupIds
        permissionType: $permissionType
        notify: $notify
        subscribe: $subscribe
        message: $message
      ) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingDialog.fragments.Petition}
  `,
  gql`
    mutation PetitionSharingModal_removePetitionPermission(
      $petitionId: GID!
      $userIds: [GID!]
      $userGroupIds: [GID!]
    ) {
      removePetitionPermission(
        petitionIds: [$petitionId]
        userIds: $userIds
        userGroupIds: $userGroupIds
      ) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingDialog.fragments.Petition}
  `,
  gql`
    mutation PetitionSharingModal_transferPetitionOwnership($petitionId: GID!, $userId: GID!) {
      transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingDialog.fragments.Petition}
  `,
];

PetitionSharingDialog.queries = [
  gql`
    query PetitionSharingModal_petitions($petitionIds: [GID!]!) {
      petitionsById(ids: $petitionIds) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingDialog.fragments.Petition}
  `,
];

function ConfirmRemovePetitionPermissionDialog({
  name = "",
  ...props
}: DialogProps<{
  name?: Maybe<string>;
}>) {
  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <FormattedMessage
          id="petition-sharing.confirm-remove.header"
          defaultMessage="Stop sharing"
        />
      }
      body={
        name ? (
          <FormattedMessage
            id="petition-sharing.confirm-remove.message"
            defaultMessage="Are you sure you want to stop sharing this petition with {name}?"
            values={{
              name: <Text as="strong">{name}</Text>,
            }}
          />
        ) : (
          <FormattedMessage
            id="petition-sharing.confirm-remove.message-2"
            defaultMessage="Are you sure you want to remove your permissions? Doing so will cause you to lose access."
          />
        )
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition-sharing.confirm-remove.confirm-button"
            defaultMessage="Yes, remove"
          />
        </Button>
      }
      {...props}
    />
  );
}

function useTransferPetitionOwnership() {
  const confirmTransferPetitionOwnership = useDialog(ConfirmTransferPetitionOwnershipDialog);
  const [transferPetitionOwnership] = useMutation(
    PetitionSharingModal_transferPetitionOwnershipDocument
  );
  return useCallback(
    async (petitionId: string, user: PetitionSharingModal_UserFragment) => {
      try {
        await confirmTransferPetitionOwnership({ user });
        await transferPetitionOwnership({
          variables: { petitionId, userId: user.id },
          refetchQueries: [getOperationName(PetitionActivity_petitionDocument)!],
        });
      } catch {}
    },
    [confirmTransferPetitionOwnership, transferPetitionOwnership]
  );
}

function ConfirmTransferPetitionOwnershipDialog({
  user,
  ...props
}: DialogProps<{ user: PetitionSharingModal_UserFragment }>) {
  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <FormattedMessage
          id="petition-sharing.confirm-transfer-ownership.header"
          defaultMessage="Transfer ownership"
        />
      }
      body={
        <FormattedMessage
          id="petition-sharing.confirm-transfer-ownership.message"
          defaultMessage="Are you sure you want to transfer the ownership of this petition to {name}?"
          values={{
            name: <Text as="strong">{user.fullName}</Text>,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition-sharing.confirm-transfer-ownership.confirm-button"
            defaultMessage="Yes, transfer"
          />
        </Button>
      }
      {...props}
    />
  );
}
