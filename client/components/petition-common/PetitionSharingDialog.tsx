import { gql } from "@apollo/client";
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
  Portal,
  Spinner,
  Stack,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  DeleteIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import {
  PetitionActivityDocument,
  PetitionSharingModal_UserFragment,
  usePetitionSharingModal_addPetitionUserPermissionMutation,
  usePetitionSharingModal_PetitionsUserPermissionsQuery,
  usePetitionSharingModal_removePetitionUserPermissionMutation,
  usePetitionSharingModal_transferPetitionOwnershipMutation,
} from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { usePreviousValue } from "beautiful-react-hooks";
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { PaddedCollapse } from "../common/PaddedCollapse";
import {
  UserMultiSelect,
  UserSelectInstance,
  UserSelectSelection,
} from "../common/UserSelect";
import { UserPermissionType } from "./UserPermissionType";

type PetitionSharingDialogData = {
  users: UserSelectSelection[];
  notify: boolean;
  message: string;
};

export function usePetitionSharingDialog() {
  return useDialog(PetitionSharingDialog);
}

export function PetitionSharingDialog({
  userId,
  petitionIds,
  isTemplate,
  ...props
}: DialogProps<{
  userId: string;
  petitionIds: string[];
  isTemplate?: boolean;
}>) {
  const intl = useIntl();
  const toast = useToast();
  const [hasUsers, setHasUsers] = useState(false);

  const { data } = usePetitionSharingModal_PetitionsUserPermissionsQuery({
    variables: { petitionIds },
    fetchPolicy: "cache-and-network",
  });

  const petitionId = petitionIds[0];
  const petitionsById = data?.petitionsById;
  const userPermissions = petitionsById?.[0]?.userPermissions;
  const prev = usePreviousValue(userPermissions);

  useEffect(() => {
    if (userPermissions && !prev) {
      setTimeout(() => usersRef.current?.focus());
    }
  }, [userPermissions, prev]);

  const { handleSubmit, register, control, watch } =
    useForm<PetitionSharingDialogData>({
      mode: "onChange",
      defaultValues: {
        users: [],
        notify: true,
        message: "",
      },
    });

  const petitionsOwned =
    petitionsById?.filter((petition) =>
      petition?.userPermissions.some(
        (up) => up.permissionType === "OWNER" && up.user.id === userId
      )
    ) ?? [];
  const petitionsRW =
    petitionsById?.filter((petition) =>
      petition?.userPermissions.some(
        (up) => up.permissionType !== "OWNER" && up.user.id === userId
      )
    ) ?? [];

  const usersRef = useRef<UserSelectInstance<true>>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const messageRegisterProps = useRegisterWithRef(
    messageRef,
    register,
    "message"
  );

  const usersToExclude =
    petitionIds.length === 1
      ? userPermissions?.map((up) => up.user.id) ?? []
      : [userId];

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, exclude: string[]) => {
      return await _handleSearchUsers(search, [...exclude, ...usersToExclude]);
    },
    [_handleSearchUsers, userPermissions]
  );
  const handleRemoveUserPermission = useRemoveUserPermission();
  const handleTransferPetitionOwnership = useTransferPetitionOwnership();

  const [addPetitionUserPermission] =
    usePetitionSharingModal_addPetitionUserPermissionMutation();

  const getSuccesTitle = () => {
    const template = intl.formatMessage(
      {
        id: "template-sharing.success-title",
        defaultMessage:
          "{count, plural, =1 {Template} other {Templates}} shared",
      },
      {
        count: petitionsOwned.length,
      }
    );

    const petition = intl.formatMessage(
      {
        id: "petition-sharing.success-title",
        defaultMessage:
          "{count, plural, =1 {Petition} other {Petitions}} shared",
      },
      {
        count: petitionsOwned.length,
      }
    );

    return isTemplate ? template : petition;
  };

  const handleAddUserPermissions = handleSubmit(
    async ({ users, notify, message }) => {
      try {
        await addPetitionUserPermission({
          variables: {
            petitionIds: petitionsOwned.map((p) => p.id),
            userIds: users.map((u) => u.id),
            permissionType: "WRITE",
            notify,
            message: message || null,
          },
          refetchQueries: [getOperationName(PetitionActivityDocument)!],
        });
        toast({
          title: getSuccesTitle(),
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        props.onResolve();
      } catch {}
    }
  );

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
      content={{ as: "form", onSubmit: handleAddUserPermissions }}
      header={
        <Stack direction="row">
          <Circle
            role="presentation"
            size="32px"
            backgroundColor="purple.500"
            color="white"
          >
            <UserArrowIcon />
          </Circle>
          <Text as="div" flex="1">
            <FormattedMessage
              id="petition-sharing.header"
              defaultMessage="Share with people"
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
                  name="users"
                  control={control}
                  rules={{ minLength: 1 }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <UserMultiSelect
                      ref={usersRef}
                      value={value}
                      onKeyDown={(e: KeyboardEvent) => {
                        if (
                          e.key === "Enter" &&
                          !(e.target as HTMLInputElement).value
                        ) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(users: UserSelectSelection[]) => {
                        onChange(users);
                        setHasUsers(Boolean(users?.length));
                      }}
                      onBlur={onBlur}
                      onSearchUsers={handleSearchUsers}
                      isDisabled={!petitionsOwned.length}
                      placeholder={
                        petitionsOwned.length
                          ? intl.formatMessage({
                              id: "petition-sharing.input-placeholder",
                              defaultMessage:
                                "Add users from your organization",
                            })
                          : intl.formatMessage({
                              id: "petition-sharing.input-placeholder-not-owner",
                              defaultMessage:
                                "Only the petition owner can share it",
                            })
                      }
                    />
                  )}
                />
              </Box>
              {/* PermissionTypeSelect */}
            </Stack>
            <Stack display={hasUsers ? "flex" : "none"}>
              <Checkbox
                {...register("notify")}
                colorScheme="purple"
                defaultIsChecked
              >
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
            </Stack>
            <Stack
              display={hasUsers || petitionIds.length !== 1 ? "none" : "flex"}
              paddingTop={2}
            >
              {userPermissions?.map(({ user, permissionType }) => (
                <Flex key={user.id} alignItems="center">
                  <Avatar role="presentation" name={user.fullName!} size="sm" />
                  <Box flex="1" minWidth={0} fontSize="sm" marginLeft={2}>
                    <Text isTruncated>
                      {user.fullName}{" "}
                      {userId === user.id ? (
                        <Text as="span">
                          {"("}
                          <FormattedMessage
                            id="generic.you"
                            defaultMessage="You"
                          />
                          {")"}
                        </Text>
                      ) : null}
                    </Text>
                    <Text color="gray.500" isTruncated>
                      {user.email}
                    </Text>
                  </Box>
                  {permissionType === "OWNER" || !petitionsOwned.length ? (
                    <Box
                      paddingX={3}
                      fontWeight="bold"
                      fontStyle="italic"
                      fontSize="sm"
                      color="gray.500"
                      cursor="default"
                    >
                      <UserPermissionType type={permissionType} />
                    </Box>
                  ) : (
                    <Menu placement="bottom-end">
                      <MenuButton
                        as={Button}
                        variant="ghost"
                        size="sm"
                        rightIcon={<ChevronDownIcon />}
                      >
                        <UserPermissionType type="WRITE" />
                      </MenuButton>
                      <Portal>
                        <MenuList minWidth={40}>
                          <MenuItem
                            onClick={() =>
                              handleTransferPetitionOwnership(petitionId, user)
                            }
                          >
                            <UserArrowIcon marginRight={2} />
                            <FormattedMessage
                              id="generic.transfer-ownership"
                              defaultMessage="Transfer ownership"
                            />
                          </MenuItem>
                          <MenuItem
                            color="red.500"
                            onClick={() =>
                              handleRemoveUserPermission(petitionId, user)
                            }
                          >
                            <DeleteIcon marginRight={2} />
                            <FormattedMessage
                              id="generic.remove"
                              defaultMessage="Remove"
                            />
                          </MenuItem>
                        </MenuList>
                      </Portal>
                    </Menu>
                  )}
                </Flex>
              ))}
            </Stack>
            <Stack
              display={
                petitionsRW.length && petitionIds.length !== 1 ? "flex" : "none"
              }
            >
              <Alert
                status="warning"
                backgroundColor="orange.100"
                borderRadius="md"
              >
                <Flex alignItems="center" justifyContent="flex-start">
                  <AlertIcon color="yellow.500" />
                  <AlertDescription>
                    {petitionsRW.length !== petitionIds.length ? (
                      <>
                        <Text>
                          {isTemplate ? (
                            <FormattedMessage
                              id="template-sharing.insufficient-permissions-list"
                              defaultMessage="The following {count, plural, =1 {template has} other {templates have}} been ignored and cannot be shared due to lack of permissions:"
                              values={{ count: petitionsRW.length }}
                            />
                          ) : (
                            <FormattedMessage
                              id="petition-sharing.insufficient-permissions-list"
                              defaultMessage="The following {count, plural, =1 {petition has} other {petitions have}} been ignored and cannot be shared due to lack of permissions:"
                              values={{ count: petitionsRW.length }}
                            />
                          )}
                        </Text>
                        <UnorderedList paddingLeft={2}>
                          {petitionsRW.map((petition) => (
                            <ListItem key={petition!.id}>
                              {petition!.name}
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
          <Button
            colorScheme="purple"
            variant="solid"
            onClick={() => props.onReject()}
          >
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
        userPermissions {
          permissionType
          user {
            id
            ...PetitionSharingModal_User
          }
        }
      }
      ${this.User}
    `;
  },
  get User() {
    return gql`
      fragment PetitionSharingModal_User on User {
        id
        email
        fullName
        ...UserSelect_User
      }
      ${UserMultiSelect.fragments.User}
    `;
  },
};

PetitionSharingDialog.mutations = [
  gql`
    mutation PetitionSharingModal_addPetitionUserPermission(
      $petitionIds: [GID!]!
      $userIds: [GID!]!
      $permissionType: PetitionUserPermissionTypeRW!
      $notify: Boolean
      $message: String
    ) {
      addPetitionUserPermission(
        petitionIds: $petitionIds
        userIds: $userIds
        permissionType: $permissionType
        notify: $notify
        message: $message
      ) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingDialog.fragments.Petition}
  `,
  gql`
    mutation PetitionSharingModal_removePetitionUserPermission(
      $petitionId: GID!
      $userId: GID!
    ) {
      removePetitionUserPermission(
        petitionIds: [$petitionId]
        userIds: [$userId]
      ) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingDialog.fragments.Petition}
  `,
  gql`
    mutation PetitionSharingModal_transferPetitionOwnership(
      $petitionId: GID!
      $userId: GID!
    ) {
      transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingDialog.fragments.Petition}
  `,
];

PetitionSharingDialog.queries = [
  gql`
    query PetitionSharingModal_PetitionsUserPermissions($petitionIds: [GID!]!) {
      petitionsById(ids: $petitionIds) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingDialog.fragments.Petition}
  `,
];

function useRemoveUserPermission() {
  const confirmRemoveUserPermission = useDialog(
    ConfirmRemoveUserPermissionDialog
  );
  const [removePetitionUserPermission] =
    usePetitionSharingModal_removePetitionUserPermissionMutation();
  return useCallback(
    async (petitionId: string, user: PetitionSharingModal_UserFragment) => {
      try {
        await confirmRemoveUserPermission({ user });
        await removePetitionUserPermission({
          variables: { petitionId, userId: user.id },
          refetchQueries: [getOperationName(PetitionActivityDocument)!],
        });
      } catch {}
    },
    [confirmRemoveUserPermission, removePetitionUserPermission]
  );
}

function ConfirmRemoveUserPermissionDialog({
  user,
  ...props
}: DialogProps<{ user: PetitionSharingModal_UserFragment }>) {
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
        <FormattedMessage
          id="petition-sharing.confirm-remove.message"
          defaultMessage="Are you sure you want to stop sharing this petition with {name}?"
          values={{
            name: <Text as="strong">{user.fullName}</Text>,
          }}
        />
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
  const confirmTransferPetitionOwnership = useDialog(
    ConfirmTransferPetitionOwnershipDialog
  );
  const [transferPetitionOwnership] =
    usePetitionSharingModal_transferPetitionOwnershipMutation();
  return useCallback(
    async (petitionId: string, user: PetitionSharingModal_UserFragment) => {
      try {
        await confirmTransferPetitionOwnership({ user });
        await transferPetitionOwnership({
          variables: { petitionId, userId: user.id },
          refetchQueries: [getOperationName(PetitionActivityDocument)!],
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
