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
  Spinner,
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
  CreateUserDialog_emailIsRegisteredQuery,
  CreateUserDialog_emailIsRegisteredQueryVariables,
} from "@parallel/graphql/__types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import useMergedRef from "@react-hook/merged-ref";
import { useEffect, useRef, useState } from "react";
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

  const emailRef = useRef<HTMLInputElement>(null);

  const apollo = useApolloClient();
  const debouncedEmailIsRegistered = useDebouncedAsync(
    async (email: string) => {
      const { data } = await apollo.query<
        CreateUserDialog_emailIsRegisteredQuery,
        CreateUserDialog_emailIsRegisteredQueryVariables
      >({
        query: gql`
          query CreateUserDialog_emailIsRegistered($email: String!) {
            emailIsRegistered(email: $email)
          }
        `,
        variables: { email },
        fetchPolicy: "no-cache",
      });
      return data.emailIsRegistered;
    },
    300,
    []
  );

  const [emailCheck, setEmailCheck] = useState({
    searching: false,
    isRegistered: false,
  });
  const email = watch("email");
  useEffect(() => {
    if (email.match(EMAIL_REGEX)) {
      setEmailCheck({ searching: true, isRegistered: false });
      debouncedEmailIsRegistered(email).then((isRegistered) => {
        setEmailCheck({ searching: false, isRegistered });
      });
    }
  }, [email]);

  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => {
          if (!emailCheck.isRegistered) {
            props.onResolve(data);
          }
        }),
      }}
      initialFocusRef={emailRef}
      header={
        <FormattedMessage
          id="organization.create-user-dialog.header"
          defaultMessage="Create user"
        />
      }
      body={
        <Stack>
          <FormControl
            id="create-user-email"
            isInvalid={!!errors.email || emailCheck.isRegistered}
          >
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
                  register({ required: true, pattern: EMAIL_REGEX })
                )}
                name="email"
                placeholder={intl.formatMessage({
                  id: "generic.forms.email-placeholder",
                  defaultMessage: "name@example.com",
                })}
              />
              <InputRightElement>
                {email.match(EMAIL_REGEX) && (
                  <Center>
                    {emailCheck.searching ? (
                      <Spinner
                        size="sm"
                        thickness="3px"
                        speed="1s"
                        color="green.500"
                      />
                    ) : emailCheck.isRegistered ? (
                      <CloseIcon color="red.500" />
                    ) : (
                      <CheckIcon color="green.500" />
                    )}
                  </Center>
                )}
              </InputRightElement>
            </InputGroup>
            {emailCheck.isRegistered ? (
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
            id="organization.create-user-dialog.confirm"
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
