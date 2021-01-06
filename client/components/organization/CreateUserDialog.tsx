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
  const {
    handleSubmit,
    register,
    errors,
    watch,
  } = useForm<CreateUserDialogData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      role: "NORMAL",
    },
  });

  const email = watch("email");
  const emailRef = useRef<HTMLInputElement>(null);

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
      /**
       * "debounced" error means the search was cancelled because user is typing
       * in that case, return true to give positive feedback.
       * This can also result in a false positive, closing the dialog
       * (user submits twice in less than the debounce timeout)
       */
      return e === "debounced";
    }
  };

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
          id="organization.create-user"
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
                ref={useMergedRef(
                  emailRef,
                  register({
                    required: true,
                    pattern: EMAIL_REGEX,
                    validate: { emailIsAvailable },
                  })
                )}
                name="email"
                placeholder={intl.formatMessage({
                  id: "generic.forms.email-placeholder",
                  defaultMessage: "name@example.com",
                })}
              />
              {email?.match(EMAIL_REGEX) ? (
                <InputRightElement>
                  <Center>
                    {errors.email?.type === "emailIsAvailable" ? (
                      <CloseIcon color="red.500" fontSize="sm" />
                    ) : (
                      <CheckIcon color="green.500" />
                    )}
                  </Center>
                </InputRightElement>
              ) : null}
            </InputGroup>
            {errors.email?.type === "emailIsAvailable" ? (
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
            )}
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
            <Input ref={register({ required: true })} name="firstName" />
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
            <Input ref={register({ required: true })} name="lastName" />
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
            <Select name="role" ref={register({ required: true })}>
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
            id="organization.create-user"
            defaultMessage="Create user"
          />
        </Button>
      }
      cancel={
        <Button onClick={props.onReject}>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreateUserDialog() {
  return useDialog(CreateUserDialog);
}
