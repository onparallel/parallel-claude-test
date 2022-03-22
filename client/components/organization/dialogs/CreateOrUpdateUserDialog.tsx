import { gql, useApolloClient } from "@apollo/client";
import {
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { UserGroupSelect, useSearchUserGroups } from "@parallel/components/common/UserGroupSelect";
import { UserSelect } from "@parallel/components/common/UserSelect";
import {
  CreateUserDialog_emailIsAvailableDocument,
  OrganizationRole,
  useCreateOrUpdateUserDialog_UserFragment,
  UserSelect_UserGroupFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useOrganizationRoles } from "@parallel/utils/useOrganizationRoles";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

interface CreateOrUpdateUserDialogProps {
  user?: useCreateOrUpdateUserDialog_UserFragment;
  myId: string;
  myRole: OrganizationRole;
}

interface CreateOrUpdateUserDialogData {
  firstName: string;
  lastName: string;
  email: string;
  role: OrganizationRole;
  userGroups: UserSelect_UserGroupFragment[];
}

function CreateOrUpdateUserDialog({
  myId,
  myRole,
  user,
  ...props
}: DialogProps<CreateOrUpdateUserDialogProps, CreateOrUpdateUserDialogData>) {
  const isUpdate = isDefined(user);
  const intl = useIntl();
  const { handleSubmit, register, formState, control } = useForm<CreateOrUpdateUserDialogData>({
    mode: "onChange",
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "NORMAL",
      userGroups: user?.userGroups ?? [],
    },
  });

  const cantEdit = ["COLLABORATOR", "NORMAL"].includes(myRole);

  const { errors } = formState;

  const apollo = useApolloClient();
  const debouncedEmailIsAvailable = useDebouncedAsync(
    async (email: string) => {
      const { data } = await apollo.query({
        query: CreateUserDialog_emailIsAvailableDocument,
        variables: { email },
        fetchPolicy: "no-cache",
      });
      return data.emailIsAvailable;
    },
    300,
    []
  );

  const groupsToExclude = [] as string[];

  const _handleSearchUserGroups = useSearchUserGroups();
  const handleSearchUserGroups = useCallback(
    async (search: string, excludeUserGroups: string[]) => {
      return await _handleSearchUserGroups(search, {
        excludeUserGroups: [...excludeUserGroups, ...groupsToExclude],
      });
    },
    [_handleSearchUserGroups, groupsToExclude.join(",")]
  );

  const roles = useOrganizationRoles();

  const emailIsAvailable = async (value: string) => {
    try {
      return await debouncedEmailIsAvailable(value);
    } catch (e: any) {
      // "DEBOUNCED" error means the search was cancelled because user kept typing
      if (e === "DEBOUNCED") {
        return "DEBOUNCED";
      } else if (isApolloError(e)) {
        return e.graphQLErrors[0]?.extensions?.code as string;
      } else {
        throw e;
      }
    }
  };

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
    validate: isUpdate ? undefined : { emailIsAvailable },
  });

  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      initialFocusRef={emailRef}
      header={
        isUpdate ? (
          <FormattedMessage
            id="components.create-or-update-user-dialog.update-user"
            defaultMessage="Update user"
          />
        ) : (
          <FormattedMessage
            id="components.create-or-update-user-dialog.invite-user"
            defaultMessage="Invite user"
          />
        )
      }
      body={
        <Stack>
          <FormControl
            id="create-user-email"
            isInvalid={!!errors.email}
            isDisabled={isUpdate || cantEdit}
          >
            <FormLabel>
              <FormattedMessage id="generic.forms.email-label" defaultMessage="Email" />
            </FormLabel>
            <InputGroup>
              <Input
                {...emailRegisterProps}
                placeholder={intl.formatMessage({
                  id: "generic.forms.email-placeholder",
                  defaultMessage: "name@example.com",
                })}
              />
              {formState.dirtyFields.email && !formState.isValidating ? (
                <InputRightElement>
                  <Center>
                    {errors.email?.type === "emailIsAvailable" &&
                    errors.email.message !== "DEBOUNCED" ? (
                      <CloseIcon color="red.500" fontSize="sm" />
                    ) : errors.email === undefined ? (
                      <CheckIcon color="green.500" />
                    ) : null}
                  </Center>
                </InputRightElement>
              ) : null}
            </InputGroup>
            {errors.email?.message !== "DEBOUNCED" ? (
              <FormErrorMessage>
                {errors.email?.message === "EMAIL_ALREADY_REGISTERED_ERROR" ? (
                  <FormattedMessage
                    id="generic.forms.email-already-registered-error"
                    defaultMessage="This email is already registered"
                  />
                ) : (
                  <FormattedMessage
                    id="generic.forms.invalid-email-error"
                    defaultMessage="Please, enter a valid email"
                  />
                )}
              </FormErrorMessage>
            ) : null}
          </FormControl>
          <Stack direction={{ base: "column", sm: "row" }}>
            <FormControl
              id="create-user-firstname"
              isInvalid={!!errors.firstName}
              isDisabled={isUpdate || cantEdit}
              flex="1"
            >
              <FormLabel>
                <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
              </FormLabel>
              <Input {...register("firstName", { required: true })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-first-name-error"
                  defaultMessage="Please, enter the first name"
                />
              </FormErrorMessage>
            </FormControl>
            <FormControl
              id="create-user-lastname"
              isInvalid={!!errors.lastName}
              isDisabled={isUpdate}
              flex="1"
            >
              <FormLabel>
                <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
              </FormLabel>
              <Input {...register("lastName", { required: true })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-last-name-error"
                  defaultMessage="Please, enter the last name"
                />
              </FormErrorMessage>
            </FormControl>
          </Stack>
          <FormControl
            id="create-user-role"
            isInvalid={!!errors.role}
            isDisabled={
              user?.id === myId || user?.role === "OWNER" || user?.status === "INACTIVE" || cantEdit
            }
          >
            <FormLabel>
              <FormattedMessage
                id="generic.forms.organization-role-label"
                defaultMessage="Organization role"
              />
            </FormLabel>
            <Select {...register("role", { required: true })}>
              {(user?.role === "OWNER" ? roles : roles.filter((r) => r.role !== "OWNER")).map(
                (r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                )
              )}
            </Select>
          </FormControl>
          <FormControl id="create-user-groups" isDisabled={user?.status === "INACTIVE" || cantEdit}>
            <FormLabel>
              {isUpdate ? (
                <FormattedMessage
                  id="components.create-or-update-user-dialog.member-of"
                  defaultMessage="Member of (optional)"
                />
              ) : (
                <FormattedMessage
                  id="organization-users.invite-user.add-as-member-in"
                  defaultMessage="Add as a member of (optional)"
                />
              )}
            </FormLabel>
            <Controller
              name="userGroups"
              control={control}
              rules={{ minLength: 1 }}
              render={({ field: { onChange, onBlur, value } }) => (
                <UserGroupSelect
                  isMulti
                  value={value}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(userGroups: any) => {
                    onChange(userGroups);
                  }}
                  onBlur={onBlur}
                  onSearch={handleSearchUserGroups}
                />
              )}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button
          type="submit"
          colorScheme="purple"
          variant="solid"
          isDisabled={user?.status === "INACTIVE" || cantEdit}
        >
          {isUpdate ? (
            <FormattedMessage
              id="components.create-or-update-user-dialog.update-user"
              defaultMessage="Update user"
            />
          ) : (
            <FormattedMessage
              id="components.create-or-update-user-dialog.invite-user"
              defaultMessage="Invite user"
            />
          )}
        </Button>
      }
      {...props}
    />
  );
}

useCreateOrUpdateUserDialog.fragments = {
  get User() {
    return gql`
      fragment useCreateOrUpdateUserDialog_User on User {
        id
        firstName
        lastName
        email
        role
        status
        userGroups {
          ...useCreateOrUpdateUserDialog_UserGroup
        }
      }
      ${this.UserGroup}
    `;
  },
  get UserGroup() {
    return gql`
      fragment useCreateOrUpdateUserDialog_UserGroup on UserGroup {
        id
        ...UserSelect_UserGroup
      }
      ${UserSelect.fragments.UserGroup}
    `;
  },
};

CreateOrUpdateUserDialog.queries = [
  gql`
    query CreateUserDialog_emailIsAvailable($email: String!) {
      emailIsAvailable(email: $email)
    }
  `,
];

export function useCreateOrUpdateUserDialog() {
  return useDialog(CreateOrUpdateUserDialog);
}
