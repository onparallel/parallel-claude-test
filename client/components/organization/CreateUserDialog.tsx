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
  Text,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  OrganizationRole,
  CreateUserDialog_emailIsAvailableQuery,
  CreateUserDialog_emailIsAvailableQueryVariables,
} from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import useMergedRef from "@react-hook/merged-ref";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface CreateUserDialogData {
  firstName: string;
  lastName: string;
  email: string;
  role: OrganizationRole;
}

export function CreateUserDialog({
  ...props
}: DialogProps<{}, CreateUserDialogData>) {
  const intl = useIntl();
  const { handleSubmit, register, formState } = useForm<CreateUserDialogData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      role: "NORMAL",
    },
  });

  const { errors } = formState;

  const apollo = useApolloClient();
  const debouncedEmailIsAvailable = useDebouncedAsync(
    async (email: string) => {
      const { data } = await apollo.query<
        CreateUserDialog_emailIsAvailableQuery,
        CreateUserDialog_emailIsAvailableQueryVariables
      >({
        query: gql`
          query CreateUserDialog_emailIsAvailable($email: String!) {
            emailIsAvailable(email: $email)
          }
        `,
        variables: { email },
        fetchPolicy: "no-cache",
      });
      return data.emailIsAvailable;
    },
    300,
    []
  );

  const emailIsAvailable = async (value: string) => {
    try {
      return await debouncedEmailIsAvailable(value);
    } catch (e) {
      // "DEBOUNCED" error means the search was cancelled because user kept typing
      if (e === "DEBOUNCED") {
        return "DEBOUNCED";
      } else {
        throw e;
      }
    }
  };

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
    validate: { emailIsAvailable },
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
        <FormattedMessage
          id="organization-users.create-user"
          defaultMessage="Create user"
        />
      }
      body={
        <Stack>
          <FormControl id="create-user-email" isInvalid={!!errors.email}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.email-label"
                defaultMessage="Email"
              />
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
              errors.email?.type === "emailIsAvailable" ? (
                <Text color="red.500" fontSize="sm" marginTop={2}>
                  <FormattedMessage
                    id="generic.forms.email-already-registered-error"
                    defaultMessage="This email is already registered"
                  />
                </Text>
              ) : (
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.invalid-email-error"
                    defaultMessage="Please, enter a valid email"
                  />
                </FormErrorMessage>
              )
            ) : null}
          </FormControl>
          <FormControl
            id="create-user-firstname"
            isInvalid={!!errors.firstName}
          >
            <FormLabel>
              <FormattedMessage
                id="generic.forms.first-name-label"
                defaultMessage="First name"
              />
            </FormLabel>
            <Input {...register("firstName", { required: true })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-user-first-name-error"
                defaultMessage="Please, enter the user first name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="create-user-lastname" isInvalid={!!errors.lastName}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.last-name-label"
                defaultMessage="Last name"
              />
            </FormLabel>
            <Input {...register("lastName", { required: true })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-user-last-name-error"
                defaultMessage="Please, enter the user last name"
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
              <option value="NORMAL">
                {intl.formatMessage({
                  id: "organization.role.normal",
                  defaultMessage: "Normal",
                })}
              </option>
              <option value="ADMIN">
                {intl.formatMessage({
                  id: "organization.role.admin",
                  defaultMessage: "Administrator",
                })}
              </option>
            </Select>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          <FormattedMessage
            id="organization-users.create-user"
            defaultMessage="Create user"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreateUserDialog() {
  return useDialog(CreateUserDialog);
}
