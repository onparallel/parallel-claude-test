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
  Alert,
  AlertDescription,
  AlertIcon,
  Flex,
  UnorderedList,
  ListItem,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import {
  PetitionActivityDocument,
  usePetitionsSharingModal_PetitionsUserPermissionsQuery,
  usePetitionsSharingModal_addPetitionsUserPermissionMutation,
  Petition,
} from "@parallel/graphql/__types";
import { If } from "@parallel/utils/conditions";
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
  isTemplates,
  ...props
}: DialogProps<{
  userId: string;
  petitionIds: string[];
  isTemplates?: boolean;
}>) {
  const intl = useIntl();
  const toast = useToast();

  const [hasUsers, setHasUsers] = useState(false);
  const [petitionsOwned, setPetitionsOwned] = useState<Array<Petition>>([]);
  const [petitionsRW, setPetitionsRW] = useState<Array<Petition>>([]);

  const { data } = usePetitionsSharingModal_PetitionsUserPermissionsQuery({
    variables: { petitionIds },
    fetchPolicy: "cache-and-network",
  });

  const petitionsById = data?.petitionsById as Array<Petition>;

  useEffect(() => {
    if (petitionsById) {
      setPetitionsOwned(
        petitionsById.filter((petition) =>
          petition.userPermissions.some(
            (up) => up.permissionType === "OWNER" && up.user.id === userId
          )
        )
      );
      setPetitionsRW(
        petitionsById.filter((petition) =>
          petition.userPermissions.some(
            (up) => up.permissionType !== "OWNER" && up.user.id === userId
          )
        )
      );
    }
  }, [petitionsById]);

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
      return await _handleSearchUsers(search, [...exclude, userId]);
    },
    [_handleSearchUsers]
  );

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

    return isTemplates ? template : petition;
  };

  const [
    addPetitionUserPermission,
  ] = usePetitionsSharingModal_addPetitionsUserPermissionMutation();

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
                              id:
                                "petition-sharing.input-placeholder-not-owner",
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
            <Stack display={petitionsRW.length ? "flex" : "none"}>
              <Alert
                status="warning"
                backgroundColor="orange.100"
                borderRadius="md"
              >
                <Flex alignItems="center" justifyContent="flex-start">
                  <AlertIcon color="yellow.500" />
                  <AlertDescription>
                    <If condition={petitionsRW.length !== petitionIds.length}>
                      <Text>
                        {isTemplates ? (
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
                          <ListItem key={petition.id}>{petition.name}</ListItem>
                        ))}
                      </UnorderedList>
                    </If>
                    <If condition={petitionsRW.length === petitionIds.length}>
                      <Text>
                        {isTemplates ? (
                          <FormattedMessage
                            id="petition-sharing.insufficient-permissions"
                            defaultMessage="You do not have permission to share the selected petitions."
                          />
                        ) : (
                          <FormattedMessage
                            id="template-sharing.insufficient-permissions"
                            defaultMessage="You do not have permission to share the selected templates."
                          />
                        )}
                      </Text>
                    </If>
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

PetitionsSharingDialog.fragments = {
  get Petition() {
    return gql`
      fragment PetitionsSharingModal_Petition on PetitionBase {
        id
        name
        userPermissions {
          permissionType
          user {
            id
            ...PetitionsSharingModal_User
          }
        }
      }
      ${this.User}
    `;
  },
  get User() {
    return gql`
      fragment PetitionsSharingModal_User on User {
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
        ...PetitionsSharingModal_Petition
      }
    }
    ${PetitionsSharingDialog.fragments.Petition}
  `,
];

PetitionsSharingDialog.queries = [
  gql`
    query PetitionsSharingModal_PetitionsUserPermissions(
      $petitionIds: [GID!]!
    ) {
      petitionsById(ids: $petitionIds) {
        ...PetitionsSharingModal_Petition
      }
    }
    ${PetitionsSharingDialog.fragments.Petition}
  `,
];
