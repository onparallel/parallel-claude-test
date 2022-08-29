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
  FormControl,
  ListItem,
  Menu,
  MenuButton,
  MenuDivider,
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
import { PetitionName } from "@parallel/components/common/PetitionName";
import { UserGroupMembersPopover } from "@parallel/components/common/UserGroupMembersPopover";
import {
  NewPetition_templatesDocument,
  PetitionActivity_petitionDocument,
  PetitionBaseType,
  PetitionPermissionType,
  PetitionPermissionTypeRW,
  PetitionSharingModal_addPetitionPermissionDocument,
  PetitionSharingModal_editPetitionPermissionDocument,
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
import { isDefined } from "remeda";
import { useSearchUsers } from "../../../utils/useSearchUsers";
import { GrowingTextarea } from "../../common/GrowingTextarea";
import { HelpPopover } from "../../common/HelpPopover";
import { PaddedCollapse } from "../../common/PaddedCollapse";
import { UserAvatar } from "../../common/UserAvatar";
import { UserSelect, UserSelectInstance, UserSelectSelection } from "../../common/UserSelect";
import { PetitionPermissionTypeText } from "../PetitionPermissionType";
import { PetitionPermissionTypeSelect } from "../PetitionPermissionTypeSelect";

type PetitionSharingDialogData = {
  selection: UserSelectSelection<true>[];
  permissionType: PetitionPermissionTypeRW;
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
  petitionIds,
  folderIds,
  userId,
  type,
  currentPath,
  ...props
}: DialogProps<
  {
    petitionIds?: string[];
    folderIds?: string[];
    userId: string;
    type: PetitionBaseType;
    currentPath?: string;
  },
  PetitionSharingDialogResult
>) {
  const intl = useIntl();
  const toast = useToast();
  const [hasUsers, setHasUsers] = useState(false);

  const isTemplate = type === "TEMPLATE";

  const { data, loading } = useQuery(PetitionSharingModal_petitionsDocument, {
    variables: {
      petitionIds: petitionIds ?? null,
      folders: folderIds ? { folderIds, type } : null,
    },
    fetchPolicy: "cache-and-network",
  });

  const petitions = data?.petitionsById.filter(isDefined) ?? [];

  useEffect(() => {
    if (!loading) {
      setTimeout(() => usersRef.current?.focus());
    }
  }, [loading]);

  const userPermissions = (petitions[0]?.permissions.filter(
    (p) => p.__typename === "PetitionUserPermission"
  ) ?? []) as PetitionSharingModal_PetitionUserPermissionFragment[];

  const groupPermissions = (petitions[0]?.permissions.filter(
    (p) => p.__typename === "PetitionUserGroupPermission"
  ) ?? []) as PetitionSharingModal_PetitionUserGroupPermissionFragment[];

  const { handleSubmit, register, control, watch } = useForm<PetitionSharingDialogData>({
    mode: "onChange",
    defaultValues: {
      selection: [],
      permissionType: "WRITE",
      notify: true,
      subscribe: true,
      message: "",
    },
  });

  const permissionType = watch("permissionType");

  const petitionsOwned =
    petitions.filter((petition) => petition.myEffectivePermission?.permissionType === "OWNER") ??
    [];

  const petitionsOwnedWrite =
    petitions.filter(
      (petition) =>
        petition.myEffectivePermission?.permissionType === "OWNER" ||
        petition.myEffectivePermission?.permissionType === "WRITE"
    ) ?? [];

  const petitionsRead =
    petitions.filter((petition) => petition.myEffectivePermission?.permissionType === "READ") ?? [];

  const usersRef = useRef<UserSelectInstance<true, true>>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const messageRegisterProps = useRegisterWithRef(messageRef, register, "message");

  const usersToExclude =
    petitions.length === 1
      ? [groupPermissions.some((g) => g.group.imMember) ? userId : null]
          .filter(isDefined)
          .concat(userPermissions.map((p) => p.user.id) ?? [])
      : [userId];

  const groupsToExclude =
    petitions.length === 1 ? groupPermissions.map((p) => p.group.id) ?? [] : [];

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

  interface PetitionPermissionProps {
    petitionId: string;
    user?: PetitionSharingModal_UserFragment;
    userGroup?: PetitionSharingModal_UserGroupFragment;
    permissionType?: PetitionPermissionType;
  }

  const confirmRemovePetitionPermission = useDialog(ConfirmRemovePetitionPermissionDialog);
  const [removePetitionPermission] = useMutation(
    PetitionSharingModal_removePetitionPermissionDocument
  );

  const handleRemovePetitionPermission = async ({
    petitionId,
    user,
    userGroup,
  }: PetitionPermissionProps) => {
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
          if (!data?.removePetitionPermission[0]) {
            client.evict({ id: petitionId });
            client.gc();
            props.onResolve?.({ close: true });
          }
        },
      });
    } catch {}
  };

  const [editPetitionPermission] = useMutation(PetitionSharingModal_editPetitionPermissionDocument);
  const confirmEditPetitionPermission = useDialog(ConfirmEditPetitionPermissionDialog);
  const handleChangePetitionPermissions = async ({
    petitionId,
    user,
    userGroup,
    permissionType,
  }: PetitionPermissionProps) => {
    try {
      if (isDefined(permissionType)) {
        const prop = user ? "userIds" : "userGroupIds";
        const id = user ? user.id : userGroup?.id;

        if (id === userId && permissionType === "READ") {
          await confirmEditPetitionPermission({});
        }
        await editPetitionPermission({
          variables: { petitionId, [prop]: [id], permissionType },
        });
      }
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
            permissionType,
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
        defaultMessage: "{count, plural, =1 {Parallel} other {Parallels}} shared",
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
          <Circle role="presentation" size="32px" backgroundColor="primary.500" color="white">
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
        petitions.length > 0 ? (
          <Stack>
            <Flex>
              <FormControl id="selection">
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
                      isDisabled={petitionsOwnedWrite.length === 0}
                      placeholder={
                        petitionsOwnedWrite.length
                          ? undefined
                          : intl.formatMessage({
                              id: "petition-sharing.input-placeholder-not-owner",
                              defaultMessage: "Only the parallel owner can share it",
                            })
                      }
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
                      value={value}
                      onChange={onChange}
                      hideOwner={true}
                      isDisabled={petitionsOwnedWrite.length === 0}
                    />
                  )}
                />
              </FormControl>
            </Flex>
            <Stack display={hasUsers ? "flex" : "none"}>
              <Checkbox {...register("notify")} colorScheme="primary" defaultIsChecked>
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
                <Checkbox {...register("subscribe")} colorScheme="primary" defaultIsChecked>
                  <FormattedMessage
                    id="component.petition-sharing-dialog.subscribe"
                    defaultMessage="Subscribe to notifications"
                  />
                  <HelpPopover>
                    <FormattedMessage
                      id="component.petition-sharing-dialog.subscribe-help"
                      defaultMessage="Users will receive notifications about the activity of this parallel."
                    />
                  </HelpPopover>
                </Checkbox>
              ) : null}
            </Stack>
            <Stack display={hasUsers || petitions.length !== 1 ? "none" : "flex"} paddingTop={2}>
              {userPermissions.map(({ user, permissionType }) => (
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
                  {permissionType === "OWNER" ||
                  (petitionsOwnedWrite.length === 0 && userId !== user.id) ? (
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
                        <PetitionPermissionTypeText type={permissionType} />
                      </MenuButton>
                      <MenuList minWidth={40}>
                        <MenuItem
                          onClick={() =>
                            handleChangePetitionPermissions({
                              petitionId: petitions[0]!.id,
                              user,
                              permissionType: "WRITE",
                            })
                          }
                          isDisabled={petitionsOwnedWrite.length === 0}
                        >
                          <PetitionPermissionTypeText type="WRITE" />
                        </MenuItem>
                        <MenuItem
                          onClick={() =>
                            handleChangePetitionPermissions({
                              petitionId: petitions[0]!.id,
                              user,
                              permissionType: "READ",
                            })
                          }
                          isDisabled={petitionsOwnedWrite.length === 0}
                        >
                          <PetitionPermissionTypeText type="READ" />
                        </MenuItem>
                        <MenuDivider />
                        <MenuItem
                          onClick={() => handleTransferPetitionOwnership(petitions[0].id, user)}
                          isDisabled={petitionsOwned.length === 0}
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
                              petitionId: petitions[0]!.id,
                              user,
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
                        <UserGroupMembersPopover userGroupId={group.id}>
                          <Text color="gray.500" cursor="default" isTruncated>
                            <FormattedMessage
                              id="generic.n-group-members"
                              defaultMessage="{count, plural, =1 {1 member} other {# members}}"
                              values={{ count: group.memberCount }}
                            />
                          </Text>
                        </UserGroupMembersPopover>
                      </Flex>
                    </Box>
                    {petitionsOwnedWrite.length === 0 ? (
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
                          <PetitionPermissionTypeText type={permissionType} />
                        </MenuButton>
                        <MenuList minWidth={40}>
                          <MenuItem
                            onClick={() =>
                              handleChangePetitionPermissions({
                                petitionId: petitions[0].id,
                                userGroup: group,
                                permissionType: "WRITE",
                              })
                            }
                          >
                            <PetitionPermissionTypeText type="WRITE" />
                          </MenuItem>
                          <MenuItem
                            onClick={() =>
                              handleChangePetitionPermissions({
                                petitionId: petitions[0].id,
                                userGroup: group,
                                permissionType: "READ",
                              })
                            }
                          >
                            <PetitionPermissionTypeText type="READ" />
                          </MenuItem>
                          <MenuDivider />
                          <MenuItem
                            color="red.500"
                            onClick={() =>
                              handleRemovePetitionPermission({
                                petitionId: petitions[0].id,
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
            <Stack display={petitionsRead.length && petitions.length !== 1 ? "flex" : "none"}>
              <Alert status="warning" backgroundColor="orange.100" borderRadius="md">
                <Flex alignItems="center" justifyContent="flex-start">
                  <AlertIcon color="yellow.500" />
                  <AlertDescription>
                    {petitionsRead.length !== petitions.length ? (
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
                              defaultMessage="The following {count, plural, =1 {parallel has} other {parallels have}} been ignored and cannot be shared due to lack of permissions:"
                              values={{ count: petitionsRead.length }}
                            />
                          )}
                        </Text>
                        <UnorderedList paddingLeft={4} pt={2}>
                          {petitionsRead.map((petition) => (
                            <ListItem key={petition.id}>
                              <PetitionName petition={petition} relativePath={currentPath} />
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
                            defaultMessage="You do not have permission to share the selected parallels."
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
              color="primary.500"
              size="xl"
            />
          </Center>
        )
      }
      confirm={
        hasUsers ? (
          <Button type="submit" colorScheme="primary" variant="solid">
            <FormattedMessage id="generic.send" defaultMessage="Send" />
          </Button>
        ) : (
          <Button colorScheme="primary" variant="solid" onClick={() => props.onReject()}>
            <FormattedMessage id="generic.done" defaultMessage="Done" />
          </Button>
        )
      }
    />
  );
}

const fragments = {
  get PetitionBase() {
    return gql`
      fragment PetitionSharingModal_PetitionBase on PetitionBase {
        id
        name
        path
        permissions {
          ... on PetitionUserPermission {
            ...PetitionSharingModal_PetitionUserPermission
          }
          ... on PetitionUserGroupPermission {
            ...PetitionSharingModal_PetitionUserGroupPermission
          }
        }
        myEffectivePermission {
          permissionType
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
        memberCount
        imMember
      }
    `;
  },
};

const _mutations = [
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
        ...PetitionSharingModal_PetitionBase
      }
    }
    ${fragments.PetitionBase}
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
        ...PetitionSharingModal_PetitionBase
      }
    }
    ${fragments.PetitionBase}
  `,
  gql`
    mutation PetitionSharingModal_editPetitionPermission(
      $petitionId: GID!
      $userIds: [GID!]
      $userGroupIds: [GID!]
      $permissionType: PetitionPermissionType!
    ) {
      editPetitionPermission(
        petitionIds: [$petitionId]
        userIds: $userIds
        userGroupIds: $userGroupIds
        permissionType: $permissionType
      ) {
        ...PetitionSharingModal_PetitionBase
      }
    }
    ${fragments.PetitionBase}
  `,
  gql`
    mutation PetitionSharingModal_transferPetitionOwnership($petitionId: GID!, $userId: GID!) {
      transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
        ...PetitionSharingModal_PetitionBase
      }
    }
    ${fragments.PetitionBase}
  `,
];

const _queries = [
  gql`
    query PetitionSharingModal_petitions($petitionIds: [GID!], $folders: FoldersInput) {
      petitionsById(ids: $petitionIds, folders: $folders) {
        ...PetitionSharingModal_PetitionBase
      }
    }
    ${fragments.PetitionBase}
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
            defaultMessage="Are you sure you want to stop sharing this parallel with {name}?"
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

function ConfirmEditPetitionPermissionDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <FormattedMessage
          id="petition-sharing.confirm-edit.header"
          defaultMessage="Edit permissions"
        />
      }
      body={
        <FormattedMessage
          id="petition-sharing.confirm-edit.message-2"
          defaultMessage="Are you sure you want to modify your permissions? If you do you will lose the ability to edit."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.yes-continue" defaultMessage="Yes, continue" />
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
          defaultMessage="Are you sure you want to transfer the ownership of this parallel to {name}?"
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
