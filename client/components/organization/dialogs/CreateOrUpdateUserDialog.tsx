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
import {
  CreateUserDialog_emailIsAvailableDocument,
  OrganizationRole,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useOrganizationRoles } from "@parallel/utils/useOrganizationRoles";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface CreateOrUpdateUserDialogData {
  firstName: string;
  lastName: string;
  email: string;
  role: OrganizationRole;
}

function CreateOrUpdateUserDialog({
  ...props
}: DialogProps<
  { user?: Partial<CreateOrUpdateUserDialogData>; type?: "create" | "update" },
  CreateOrUpdateUserDialogData
>) {
  const intl = useIntl();
  const { handleSubmit, register, formState } = useForm<CreateOrUpdateUserDialogData>({
    mode: "onChange",
    defaultValues: {
      firstName: props.user?.firstName ?? undefined,
      lastName: props.user?.lastName ?? undefined,
      email: props.user?.email ?? "",
      role: props.user?.role ?? "NORMAL",
    },
  });

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
    validate: props.type === "update" ? undefined : { emailIsAvailable },
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
        props.type === "update" ? (
          <FormattedMessage id="organization-users.update-user" defaultMessage="Update user" />
        ) : (
          <FormattedMessage id="organization-users.invite-user" defaultMessage="Invite user" />
        )
      }
      body={
        <Stack>
          <FormControl
            id="create-user-email"
            isInvalid={!!errors.email}
            isDisabled={props.type === "update"}
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
          <FormControl
            id="create-user-firstname"
            isInvalid={!!errors.firstName}
            isDisabled={props.type === "update"}
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
            isDisabled={props.type === "update"}
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
          <FormControl id="create-user-role" isInvalid={!!errors.role}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.organization-role-label"
                defaultMessage="Organization role"
              />
            </FormLabel>
            <Select {...register("role", { required: true })}>
              {roles
                .filter((r) => r.role !== "OWNER")
                .map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
            </Select>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          {props.type === "update" ? (
            <FormattedMessage id="organization-users.update-user" defaultMessage="Update user" />
          ) : (
            <FormattedMessage id="organization-users.invite-user" defaultMessage="Invite user" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

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
