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
import { Menu } from "@parallel/chakra/components";
import { ChevronDownIcon, DeleteIcon, UserArrowIcon, UsersIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionNameWithPath } from "@parallel/components/common/PetitionNameWithPath";
import { SubscribedNotificationsIcon } from "@parallel/components/common/SubscribedNotificationsIcon";
import { UserGroupMembersPopover } from "@parallel/components/common/UserGroupMembersPopover";
import { UserGroupReference } from "@parallel/components/common/UserGroupReference";
import { UserReference } from "@parallel/components/common/UserReference";
import {
  PetitionActivity_petitionDocument,
  PetitionBaseType,
  PetitionPermissionType,
  PetitionPermissionTypeRW,
  PetitionSharingModal_UserFragment,
  PetitionSharingModal_UserGroupFragment,
  PetitionSharingModal_petitionsSharingInfoDocument,
  PetitionSharingModal_transferPetitionOwnershipDocument,
} from "@parallel/graphql/__types";
import { assertTypenameArray, isTypename } from "@parallel/utils/apollo/typename";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { usePetitionSharingBackgroundTask } from "@parallel/utils/tasks/usePetitionSharingTask";
import { Maybe } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { useSearchUsers } from "../../../utils/useSearchUsers";
import { GrowingTextarea } from "../../common/GrowingTextarea";
import { HelpPopover } from "../../common/HelpPopover";
import { PaddedCollapse } from "../../common/PaddedCollapse";
import { UserAvatar } from "../../common/UserAvatar";
import { UserSelect, UserSelectInstance, UserSelectSelection } from "../../common/UserSelect";
import { PetitionPermissionTypeText } from "../PetitionPermissionType";
import { PetitionPermissionTypeSelect } from "../PetitionPermissionTypeSelect";

interface PetitionSharingDialogData {
  selection: UserSelectSelection<true>[];
  permissionType: PetitionPermissionTypeRW;
  notify: boolean;
  subscribe: boolean;
  message: string;
}

interface PetitionSharingDialogResult {
  close?: boolean;
}

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

  const isTemplate = type === "TEMPLATE";

  const {
    data,
    loading,
    refetch: refetchSharingInfo,
  } = useQuery(PetitionSharingModal_petitionsSharingInfoDocument, {
    variables: {
      petitionIds: petitionIds ?? null,
      folders: folderIds ? { folderIds, type } : null,
    },
    fetchPolicy: "cache-and-network",
  });

  const sharingInfo = data?.petitionsSharingInfo ?? {
    totalCount: 0,
    ownedCount: 0,
    readPetitions: [],
    ownedOrWriteIds: [],
    firstPetitionPermissions: [],
    firstPetitionEffectivePermissions: [],
  };

  useEffect(() => {
    if (!loading) {
      setTimeout(() => usersRef.current?.focus());
    }
  }, [loading]);

  const userPermissions = sharingInfo.firstPetitionPermissions.filter(
    (p) => p.__typename === "PetitionUserPermission",
  );
  assertTypenameArray(userPermissions, "PetitionUserPermission");

  const groupPermissions = sharingInfo.firstPetitionPermissions.filter(
    (p) => p.__typename === "PetitionUserGroupPermission",
  );
  assertTypenameArray(groupPermissions, "PetitionUserGroupPermission");

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

  const hasUsers = watch("selection").length;
  const notify = watch("notify");

  const usersRef = useRef<UserSelectInstance<true, true>>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const messageRegisterProps = useRegisterWithRef(messageRef, register, "message");

  const usersToExclude = sharingInfo.totalCount === 1 ? userPermissions.map((p) => p.user.id) : [];

  const groupsToExclude =
    sharingInfo.totalCount === 1 ? groupPermissions.map((p) => p.group.id) : [];

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

  interface PetitionPermissionProps {
    petitionId: string;
    user?: PetitionSharingModal_UserFragment;
    userGroup?: PetitionSharingModal_UserGroupFragment;
    permissionType?: PetitionPermissionType;
  }

  const confirmRemovePetitionPermission = useDialog(ConfirmRemovePetitionPermissionDialog);

  const { addPetitionPermission, editPetitionPermission, removePetitionPermission, isLoading } =
    usePetitionSharingBackgroundTask();

  const handleRemovePetitionPermission = async ({
    petitionId,
    user,
    userGroup,
  }: PetitionPermissionProps) => {
    try {
      const prop = user ? "userIds" : "userGroupIds";
      const name = user ? (
        <UserReference user={user} />
      ) : userGroup ? (
        <UserGroupReference userGroup={userGroup} />
      ) : undefined;
      const id = user ? user.id : userGroup?.id;

      await confirmRemovePetitionPermission({ name: id === userId ? undefined : name });
      await removePetitionPermission({
        petitionIds: [petitionId],
        [prop]: [id],
      });
      await refetchSharingInfo();
    } catch {}
  };

  const confirmEditPetitionPermission = useDialog(ConfirmEditPetitionPermissionDialog);

  const handleChangePetitionPermissions = async ({
    petitionId,
    user,
    userGroup,
    permissionType,
  }: PetitionPermissionProps) => {
    try {
      if (isNonNullish(permissionType) && permissionType !== "OWNER") {
        if (user?.id === userId && permissionType === "READ") {
          await confirmEditPetitionPermission();
        }
        await editPetitionPermission({
          petitionIds: [petitionId],
          permissionType,
          ...(user ? { userIds: [user.id] } : { userGroupIds: userGroup!.id }),
        });
        await refetchSharingInfo();
      }
    } catch {}
  };

  const handleTransferPetitionOwnership = useTransferPetitionOwnership(refetchSharingInfo);

  const showGenericErrorToast = useGenericErrorToast();

  const handleAddPetitionPermissions = handleSubmit(
    async ({ selection, notify, subscribe, message, permissionType }) => {
      const users = selection.filter(isTypename("User")).map((u) => u.id);
      const groups = selection.filter(isTypename("UserGroup")).map((g) => g.id);

      try {
        await addPetitionPermission({
          petitionIds: isNonNullish(petitionIds) && petitionIds.length > 0 ? petitionIds : null,
          folders: isNonNullish(folderIds) && folderIds.length > 0 ? { folderIds, type } : null,
          userIds: users.length ? users : null,
          userGroupIds: groups.length ? groups : null,
          permissionType,
          notify,
          subscribe: isTemplate ? false : subscribe,
          message: message || null,
        });
        toast({
          title: getSuccessTitle(),
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        props.onResolve();
      } catch (e: any) {
        if (["ABORTED", "FAILED", "TIMEOUT"].includes(e.message)) {
          showGenericErrorToast();
        } else {
          throw e;
        }
      }
    },
  );

  const getSuccessTitle = () => {
    const template = intl.formatMessage(
      {
        id: "component.petition-sharing-dialog.template-sharing-success-title",
        defaultMessage: "{count, plural, =1 {Template} other {Templates}} shared",
      },
      { count: sharingInfo.ownedOrWriteIds.length },
    );

    const petition = intl.formatMessage(
      {
        id: "component.petition-sharing-dialog.petition-sharing-success-title",
        defaultMessage: "{count, plural, =1 {Parallel} other {Parallels}} shared",
      },
      { count: sharingInfo.ownedOrWriteIds.length },
    );

    return isTemplate ? template : petition;
  };

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
              id="component.petition-sharing-dialog.header"
              defaultMessage="Share with people and teams"
            />
          </Text>
        </Stack>
      }
      body={
        sharingInfo.totalCount > 0 ? (
          <Stack>
            <Flex>
              <FormControl id="selection" flex="1 1 auto" minWidth={0} width="auto">
                <Controller
                  name="selection"
                  control={control}
                  rules={{ minLength: 1 }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <UserSelect
                      data-testid="share-petition-select"
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
                      isDisabled={sharingInfo.ownedOrWriteIds.length === 0}
                      placeholder={
                        sharingInfo.ownedOrWriteIds.length
                          ? undefined
                          : intl.formatMessage({
                              id: "component.petition-sharing-dialog.input-placeholder-not-owner",
                              defaultMessage: "Only the parallel owner can share it",
                            })
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
                    <PetitionPermissionTypeSelect
                      value={value}
                      onChange={(value) => onChange(value! as "READ" | "WRITE")}
                      hideOwner={true}
                      isDisabled={sharingInfo.ownedOrWriteIds.length === 0}
                    />
                  )}
                />
              </FormControl>
            </Flex>
            <Stack display={hasUsers ? "flex" : "none"}>
              <Checkbox {...register("notify")} defaultChecked data-testid="notify-users-checkbox">
                <FormattedMessage
                  id="component.petition-sharing-dialog.notify-checkbox"
                  defaultMessage="Notify users"
                />
              </Checkbox>
              <PaddedCollapse in={notify}>
                <GrowingTextarea
                  data-testid="notify-users-message"
                  {...messageRegisterProps}
                  maxHeight="30vh"
                  aria-label={intl.formatMessage({
                    id: "component.petition-sharing-dialog.message-placeholder",
                    defaultMessage: "Message",
                  })}
                  placeholder={intl.formatMessage({
                    id: "component.petition-sharing-dialog.message-placeholder",
                    defaultMessage: "Message",
                  })}
                  maxLength={1_000}
                />
              </PaddedCollapse>
              {!isTemplate ? (
                <Checkbox {...register("subscribe")} defaultChecked>
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
            {sharingInfo.totalCount === 1 && sharingInfo.firstPetitionPermissions.length > 0 ? (
              <Stack paddingTop={2}>
                {userPermissions.map(({ user, permissionType }) => (
                  <Flex key={user.id} alignItems="center">
                    <UserAvatar role="presentation" user={user} size="sm" />
                    <Box flex="1" minWidth={0} fontSize="sm" marginStart={2}>
                      <Flex direction="row" alignItems="center" gap={1}>
                        <Text noOfLines={1} wordBreak="break-all">
                          {user.fullName}
                        </Text>
                        {userId === user.id ? (
                          <Text as="span">
                            {"("}
                            <FormattedMessage id="generic.you" defaultMessage="You" />
                            {")"}
                          </Text>
                        ) : null}
                        {!isTemplate &&
                        sharingInfo.firstPetitionEffectivePermissions.some(
                          (ep) => ep.user.id === user.id && ep.isSubscribed,
                        ) ? (
                          <SubscribedNotificationsIcon />
                        ) : null}
                      </Flex>
                      <Text color="gray.500" noOfLines={1}>
                        {user.email}
                      </Text>
                    </Box>
                    {permissionType === "OWNER" || sharingInfo.ownedOrWriteIds.length === 0 ? (
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
                                petitionId: sharingInfo.firstPetitionPermissions[0].petition.id,
                                user,
                                permissionType: "WRITE",
                              })
                            }
                            isDisabled={sharingInfo.ownedOrWriteIds.length === 0}
                          >
                            <PetitionPermissionTypeText type="WRITE" />
                          </MenuItem>
                          <MenuItem
                            onClick={() =>
                              handleChangePetitionPermissions({
                                petitionId: sharingInfo.firstPetitionPermissions[0].petition.id,
                                user,
                                permissionType: "READ",
                              })
                            }
                            isDisabled={sharingInfo.ownedOrWriteIds.length === 0}
                          >
                            <PetitionPermissionTypeText type="READ" />
                          </MenuItem>
                          <MenuDivider />
                          <MenuItem
                            onClick={() =>
                              handleTransferPetitionOwnership(
                                sharingInfo.firstPetitionPermissions[0].petition.id,
                                user,
                              )
                            }
                            isDisabled={sharingInfo.ownedCount === 0}
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
                                petitionId: sharingInfo.firstPetitionPermissions[0].petition.id,
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
                        icon={<UsersIcon />}
                        size="sm"
                      />
                      <Box flex="1" minWidth={0} fontSize="sm" marginStart={2}>
                        <Text noOfLines={1} wordBreak="break-all">
                          <UserGroupReference userGroup={group} />
                        </Text>
                        <Flex
                          role="group"
                          flexDirection="row-reverse"
                          justifyContent="flex-end"
                          alignItems="center"
                        >
                          <UserGroupMembersPopover
                            userGroupId={group.id}
                            userDetails={(userId: string) => {
                              if (
                                !isTemplate &&
                                sharingInfo.firstPetitionEffectivePermissions.some(
                                  (ep) => ep.user.id === userId && ep.isSubscribed,
                                )
                              ) {
                                return <SubscribedNotificationsIcon />;
                              }
                              return null;
                            }}
                          >
                            <Text color="gray.500" cursor="default" noOfLines={1}>
                              <FormattedMessage
                                id="generic.n-group-members"
                                defaultMessage="{count, plural, =1 {1 member} other {# members}}"
                                values={{ count: group.memberCount }}
                              />
                            </Text>
                          </UserGroupMembersPopover>
                        </Flex>
                      </Box>
                      {sharingInfo.ownedOrWriteIds.length === 0 ? (
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
                                  petitionId: sharingInfo.firstPetitionPermissions[0].petition.id,
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
                                  petitionId: sharingInfo.firstPetitionPermissions[0].petition.id,
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
                                  petitionId: sharingInfo.firstPetitionPermissions[0].petition.id,
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
            ) : null}
            <Stack
              display={
                sharingInfo.readPetitions.length && sharingInfo.totalCount !== 1 ? "flex" : "none"
              }
            >
              <Alert status="warning" rounded="md">
                <Flex alignItems="center" justifyContent="flex-start">
                  <AlertIcon />
                  <AlertDescription>
                    {sharingInfo.readPetitions.length !== sharingInfo.totalCount ? (
                      <>
                        <Text>
                          {isTemplate ? (
                            <FormattedMessage
                              id="component.petition-sharing-dialog.template-insufficient-permissions-list"
                              defaultMessage="The following {count, plural, =1 {template has} other {templates have}} been ignored and cannot be shared due to lack of permissions:"
                              values={{ count: sharingInfo.readPetitions.length }}
                            />
                          ) : (
                            <FormattedMessage
                              id="component.petition-sharing-dialog.petition-insufficient-permissions-list"
                              defaultMessage="The following {count, plural, =1 {parallel has} other {parallels have}} been ignored and cannot be shared due to lack of permissions:"
                              values={{ count: sharingInfo.readPetitions.length }}
                            />
                          )}
                        </Text>
                        <UnorderedList paddingStart={4} pt={2}>
                          {sharingInfo.readPetitions.map((petition) => (
                            <ListItem key={petition.id}>
                              <PetitionNameWithPath
                                petition={petition}
                                relativePath={currentPath}
                              />
                            </ListItem>
                          ))}
                        </UnorderedList>
                      </>
                    ) : (
                      <Text>
                        {isTemplate ? (
                          <FormattedMessage
                            id="component.petition-sharing-dialog.template-insufficient-permissions"
                            defaultMessage="You do not have permission to share the selected templates."
                          />
                        ) : (
                          <FormattedMessage
                            id="component.petition-sharing-dialog.petition-insufficient-permissions"
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
          <Button
            data-testid="share-petition-send-button"
            type="submit"
            colorScheme="primary"
            variant="solid"
            isLoading={isLoading}
          >
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

const _fragments = {
  get User() {
    return gql`
      fragment PetitionSharingModal_User on User {
        id
        email
        fullName
        ...UserAvatar_User
        ...UserSelect_User
        ...UserReference_User
      }
      ${UserReference.fragments.User}
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
        ...UserGroupReference_UserGroup
      }
      ${UserGroupReference.fragments.UserGroup}
    `;
  },
};

const _mutations = [
  gql`
    mutation PetitionSharingModal_transferPetitionOwnership($petitionId: GID!, $userId: GID!) {
      transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
        id
      }
    }
  `,
];

const _queries = [
  gql`
    query PetitionSharingModal_petitionsSharingInfo($petitionIds: [GID!], $folders: FoldersInput) {
      petitionsSharingInfo(ids: $petitionIds, folders: $folders) {
        totalCount
        ownedCount
        ownedOrWriteIds
        readPetitions {
          id
          ...PetitionName_PetitionBase
        }
        firstPetitionPermissions {
          petition {
            id
          }
          ... on PetitionUserPermission {
            user {
              id
              ...PetitionSharingModal_User
            }
            permissionType
            isSubscribed
          }
          ... on PetitionUserGroupPermission {
            group {
              id
              ...PetitionSharingModal_UserGroup
            }
            permissionType
          }
        }
        firstPetitionEffectivePermissions {
          user {
            id
          }
          isSubscribed
        }
      }
    }
    ${PetitionNameWithPath.fragments.PetitionBase}
    ${_fragments.User}
    ${_fragments.UserGroup}
  `,
];

function ConfirmRemovePetitionPermissionDialog({
  name,
  ...props
}: DialogProps<{
  name?: Maybe<ReactNode>;
}>) {
  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <FormattedMessage
          id="component.confirm-remove-petition-permission-dialog.header"
          defaultMessage="Stop sharing"
        />
      }
      body={
        name ? (
          <FormattedMessage
            id="component.confirm-remove-petition-permission-dialog.message"
            defaultMessage="Are you sure you want to stop sharing this parallel with {name}?"
            values={{
              name: <Text as="strong">{name}</Text>,
            }}
          />
        ) : (
          <FormattedMessage
            id="component.confirm-remove-petition-permission-dialog.message-2"
            defaultMessage="Are you sure you want to remove your permissions? Doing so will cause you to lose access."
          />
        )
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-remove-petition-permission-dialog.confirm-button"
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
          id="component.confirm-edit-petition-permission-dialog.header"
          defaultMessage="Edit permissions"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-edit-petition-permission-dialog.message"
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

function useTransferPetitionOwnership(onRefetch?: () => Promise<any>) {
  const confirmTransferPetitionOwnership = useDialog(ConfirmTransferPetitionOwnershipDialog);
  const [transferPetitionOwnership] = useMutation(
    PetitionSharingModal_transferPetitionOwnershipDocument,
  );
  return useCallback(
    async (petitionId: string, user: PetitionSharingModal_UserFragment) => {
      try {
        await confirmTransferPetitionOwnership({ user });
        await transferPetitionOwnership({
          variables: { petitionId, userId: user.id },
          refetchQueries: [getOperationName(PetitionActivity_petitionDocument)!],
        });
        await onRefetch?.();
      } catch {}
    },
    [confirmTransferPetitionOwnership, transferPetitionOwnership],
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
          id="component.confirm-transfer-petition-ownership-dialog.header"
          defaultMessage="Transfer ownership"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-transfer-petition-ownership-dialog.message"
          defaultMessage="Are you sure you want to transfer the ownership of this parallel to {name}?"
          values={{
            name: <Text as="strong">{user.fullName}</Text>,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-transfer-petition-ownership-dialog.confirm-button"
            defaultMessage="Yes, transfer"
          />
        </Button>
      }
      {...props}
    />
  );
}
