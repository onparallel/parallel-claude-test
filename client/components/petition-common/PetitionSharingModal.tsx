import { gql, useApolloClient, useQuery } from "@apollo/client";
import { getOperationName } from "@apollo/client/utilities";
import {
  Avatar,
  Box,
  Button,
  Center,
  Checkbox,
  Circle,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Portal,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/core";
import {
  ChevronDownIcon,
  DeleteIcon,
  UserArrowIcon,
} from "@parallel/chakra/icons";
import {
  PetitionActivityDocument,
  PetitionSharingModal_PetitionUserPermissionsQuery,
  PetitionSharingModal_PetitionUserPermissionsQueryVariables,
  PetitionSharingModal_searchUsersQuery,
  PetitionSharingModal_searchUsersQueryVariables,
  PetitionSharingModal_UserFragment,
  usePetitionSharingModal_addPetitionUserPermissionMutation,
  usePetitionSharingModal_removePetitionUserPermissionMutation,
  usePetitionSharingModal_transferPetitionOwnershipMutation,
} from "@parallel/graphql/__types";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogOpenerProvider";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { Spacer } from "../common/Spacer";
import { UserSelect, UserSelectSelection } from "../common/UserSelect";
import { UserPermissionType } from "./UserPermissionType";

export type PetitionSharingModalProps = Omit<ModalProps, "children"> & {
  userId: string;
  petitionId: string;
};

export function PetitionSharingModal({
  userId,
  petitionId,
  ...props
}: PetitionSharingModalProps) {
  const intl = useIntl();
  const toast = useToast();
  const { data } = useGetUserPermissions({ petitionId });
  const userPermissions = data?.petition?.userPermissions;
  const isOwner = userPermissions?.some(
    (up) => up.permissionType === "OWNER" && up.user.id === userId
  );

  const [users, setUsers] = useState<UserSelectSelection[]>([]);
  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, exclude: string[]) => {
      return await _handleSearchUsers(search, [
        ...exclude,
        ...(data?.petition?.userPermissions.map((up) => up.user.id) ?? []),
      ]);
    },
    [_handleSearchUsers, data?.petition?.userPermissions]
  );
  const handleRemoveUserPermission = useRemoveUserPermission();
  const handleTransferPetitionOwnership = useTransferPetitionOwnership();

  const [
    addPetitionUserPermission,
  ] = usePetitionSharingModal_addPetitionUserPermissionMutation();

  const handleAddUserPermissions = useCallback(async () => {
    try {
      await addPetitionUserPermission({
        variables: {
          petitionId,
          userIds: users.map((u) => u.id),
          permissionType: "WRITE",
        },
        refetchQueries: [getOperationName(PetitionActivityDocument)!],
      });
      props.onClose();
      toast({
        title: intl.formatMessage({
          id: "petition-sharing.succes-title",
          defaultMessage: "Petition shared",
        }),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {}
  }, [addPetitionUserPermission, users, props.onClose]);

  return (
    <Modal {...props} size="xl">
      <ModalOverlay>
        <ModalContent borderRadius="md">
          <ModalHeader as={Stack} direction="row">
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
          </ModalHeader>
          <ModalCloseButton />
          {userPermissions ? (
            <>
              <ModalBody as={Stack}>
                <Stack direction="row">
                  <Box flex="1">
                    <UserSelect
                      value={users}
                      onChange={setUsers}
                      onSearchUsers={handleSearchUsers}
                      isDisabled={!isOwner}
                      placeholder={
                        isOwner
                          ? intl.formatMessage({
                              id: "petition-sharing.input-placeholder",
                              defaultMessage:
                                "Add users from your organization",
                            })
                          : intl.formatMessage({
                              id:
                                "petition-sharing.input-placeholder-not-owner",
                              defaultMessage:
                                "Only the petition owner can share it",
                            })
                      }
                    />
                  </Box>
                  {/* PermissionTypeSelect */}
                </Stack>
                {users.length ? (
                  <Stack>
                    <Checkbox colorScheme="purple">
                      <FormattedMessage
                        id="petition-sharing.notify-checkbox"
                        defaultMessage="Notify users"
                      />
                    </Checkbox>
                    <GrowingTextarea
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
                  </Stack>
                ) : (
                  <Stack paddingTop={2}>
                    {userPermissions.map(({ user, permissionType }) => (
                      <Flex key={user.id} alignItems="center">
                        <Avatar
                          role="presentation"
                          name={user.fullName!}
                          size="sm"
                        />
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
                        {permissionType === "OWNER" || !isOwner ? (
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
                                    handleTransferPetitionOwnership(
                                      petitionId,
                                      user
                                    )
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
                )}
              </ModalBody>
              <ModalFooter {...({ as: Stack, direction: "row" } as any)}>
                <Spacer />
                {users.length ? (
                  <>
                    <Button onClick={props.onClose}>
                      <FormattedMessage
                        id="generic.cancel"
                        defaultMessage="Cancel"
                      />
                    </Button>
                    <Button
                      colorScheme="purple"
                      variant="solid"
                      onClick={handleAddUserPermissions}
                    >
                      <FormattedMessage
                        id="generic.send"
                        defaultMessage="Send"
                      />
                    </Button>
                  </>
                ) : (
                  <Button
                    colorScheme="purple"
                    variant="solid"
                    onClick={props.onClose}
                  >
                    <FormattedMessage id="generic.done" defaultMessage="Done" />
                  </Button>
                )}
              </ModalFooter>
            </>
          ) : (
            <ModalBody as={Center} minHeight={64}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="purple.500"
                size="xl"
              />
            </ModalBody>
          )}
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

PetitionSharingModal.fragments = {
  get Petition() {
    return gql`
      fragment PetitionSharingModal_Petition on Petition {
        id
        name
        userPermissions {
          permissionType
          user {
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
      ${UserSelect.fragments.User}
    `;
  },
};

PetitionSharingModal.mutations = [
  gql`
    mutation PetitionSharingModal_addPetitionUserPermission(
      $petitionId: ID!
      $userIds: [ID!]!
      $permissionType: PetitionUserPermissionTypeRW!
    ) {
      addPetitionUserPermission(
        petitionIds: [$petitionId]
        userIds: $userIds
        permissionType: $permissionType
      ) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingModal.fragments.Petition}
  `,
  gql`
    mutation PetitionSharingModal_removePetitionUserPermission(
      $petitionId: ID!
      $userId: ID!
    ) {
      removePetitionUserPermission(
        petitionIds: [$petitionId]
        userIds: [$userId]
      ) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingModal.fragments.Petition}
  `,
  gql`
    mutation PetitionSharingModal_transferPetitionOwnership(
      $petitionId: ID!
      $userId: ID!
    ) {
      transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionSharingModal.fragments.Petition}
  `,
];

function useGetUserPermissions(
  variables: PetitionSharingModal_PetitionUserPermissionsQueryVariables
) {
  return useQuery<
    PetitionSharingModal_PetitionUserPermissionsQuery,
    PetitionSharingModal_PetitionUserPermissionsQueryVariables
  >(
    gql`
      query PetitionSharingModal_PetitionUserPermissions($petitionId: ID!) {
        petition(id: $petitionId) {
          ...PetitionSharingModal_Petition
        }
      }
      ${PetitionSharingModal.fragments.Petition}
    `,
    {
      variables,
      fetchPolicy: "cache-and-network",
    }
  );
}

function useSearchUsers() {
  const client = useApolloClient();
  return useCallback(async (search: string, exclude: string[]) => {
    const { data } = await client.query<
      PetitionSharingModal_searchUsersQuery,
      PetitionSharingModal_searchUsersQueryVariables
    >({
      query: gql`
        query PetitionSharingModal_searchUsers(
          $search: String!
          $exclude: [ID!]!
        ) {
          me {
            organization {
              users(search: $search, limit: 10, exclude: $exclude) {
                items {
                  ...UserSelect_User
                }
              }
            }
          }
        }
        ${UserSelect.fragments.User}
      `,
      variables: { search, exclude },
      fetchPolicy: "no-cache",
    });
    return data!.me.organization.users.items;
  }, []);
}

function useRemoveUserPermission() {
  const confirmRemoveUserPermission = useDialog(
    ConfirmRemoveUserPermissionDialog
  );
  const [
    removePetitionUserPermission,
  ] = usePetitionSharingModal_removePetitionUserPermissionMutation();
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
  const [
    transferPetitionOwnership,
  ] = usePetitionSharingModal_transferPetitionOwnershipMutation();
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
