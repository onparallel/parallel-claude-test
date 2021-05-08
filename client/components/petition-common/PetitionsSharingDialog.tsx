import { gql } from "@apollo/client";
import { getOperationName } from "@apollo/client/utilities";
import {
  Box,
  Button,
  Checkbox,
  Circle,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import {
  PetitionActivityDocument,
  usePetitionsSharingModal_addPetitionsUserPermissionMutation,
} from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
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

type PetitionsSharingDialogData = {
  users: UserSelectSelection[];
  notify: boolean;
  message: string;
};

export function usePetitionsSharingDialog() {
  return useDialog(PetitionsSharingDialog);
}

export function PetitionsSharingDialog({
  userId,
  petitionIds,
  ...props
}: DialogProps<{
  userId: string;
  petitionIds: string[];
}>) {
  const intl = useIntl();
  const toast = useToast();
  // const { data } = usePetitionSharingModal_PetitionUserPermissionsQuery({
  //   variables: { petitionId },
  //   fetchPolicy: "cache-and-network",
  // });
  // const userPermissions = data?.petition?.userPermissions;
  // const isOwner = userPermissions?.some(
  //   (up) => up.permissionType === "OWNER" && up.user.id === userId
  // );

  // const prev = usePreviousValue(userPermissions);
  // useEffect(() => {
  //   if (userPermissions && !prev) {
  //     setTimeout(() => usersRef.current?.focus());
  //   }
  // }, [userPermissions, prev]);

  const {
    handleSubmit,
    register,
    control,
    watch,
  } = useForm<PetitionsSharingDialogData>({
    mode: "onChange",
    defaultValues: {
      users: [],
      notify: true,
      message: "",
    },
  });
  const [hasUsers, setHasUsers] = useState(false);

  const usersRef = useRef<UserSelectInstance<true>>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const messageRegisterProps = useRegisterWithRef(
    messageRef,
    register,
    "message"
  );

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, exclude: string[]) => {
      return await _handleSearchUsers(search, [...exclude]);
    },
    [_handleSearchUsers]
  );

  const [
    addPetitionUserPermission,
  ] = usePetitionsSharingModal_addPetitionsUserPermissionMutation();

  const handleAddUserPermissions = handleSubmit(
    async ({ users, notify, message }) => {
      try {
        await addPetitionUserPermission({
          variables: {
            petitionIds,
            userIds: users.map((u) => u.id),
            permissionType: "WRITE",
            notify,
            message: message || null,
          },
          refetchQueries: [getOperationName(PetitionActivityDocument)!],
        });
        toast({
          title: intl.formatMessage({
            id: "petition-sharing.success-title",
            defaultMessage: "Petition shared",
          }),
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
                    isDisabled={false}
                    placeholder={
                      true
                        ? intl.formatMessage({
                            id: "petition-sharing.input-placeholder",
                            defaultMessage: "Add users from your organization",
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
        </Stack>
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

PetitionsSharingDialog.fragments = {
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

PetitionsSharingDialog.mutations = [
  gql`
    mutation PetitionsSharingModal_addPetitionsUserPermission(
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
    ${PetitionsSharingDialog.fragments.Petition}
  `,
];

PetitionsSharingDialog.queries = [
  gql`
    query PetitionsSharingModal_PetitionsUserPermissions($petitionId: GID!) {
      petition(id: $petitionId) {
        ...PetitionSharingModal_Petition
      }
    }
    ${PetitionsSharingDialog.fragments.Petition}
  `,
];
