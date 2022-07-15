import { gql, useApolloClient } from "@apollo/client";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { UserPlusIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  InviteUserDialog_emailIsAvailableDocument,
  OrganizationRole,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useOrganizationRoles } from "@parallel/utils/useOrganizationRoles";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface InviteUserDialogData {
  email: string;
  firstName: string;
  lastName: string;
  locale: string;
  role: OrganizationRole;
}

export function InviteUserDialog({ ...props }: DialogProps<{}, InviteUserDialogData>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<InviteUserDialogData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      locale: intl.locale,
      role: "NORMAL",
    },
  });

  const apollo = useApolloClient();
  const debouncedEmailIsAvailable = useDebouncedAsync(
    async (email: string) => {
      const { data } = await apollo.query({
        query: InviteUserDialog_emailIsAvailableDocument,
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
    validate: { emailIsAvailable },
  });

  const locales = useSupportedLocales();
  const roles = useOrganizationRoles();

  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      initialFocusRef={emailRef}
      header={
        <Stack direction={"row"} spacing={2} align="center">
          <UserPlusIcon role="presentation" />
          <Text>
            <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
          </Text>
        </Stack>
      }
      body={
        <Stack>
          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel>
              <FormattedMessage id="generic.forms.email-label" defaultMessage="Email" />
            </FormLabel>
            <Input
              type="email"
              {...emailRegisterProps}
              placeholder={intl.formatMessage({
                id: "generic.forms.email-placeholder",
                defaultMessage: "name@example.com",
              })}
            />
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
          <FormControl id="first-name" isInvalid={!!errors.firstName}>
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
          <FormControl id="last-name" isInvalid={!!errors.lastName}>
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
          <FormControl id="locale" isInvalid={!!errors.lastName}>
            <FormLabel>
              <FormattedMessage id="generic.language" defaultMessage="Language" />
            </FormLabel>
            <Select {...register("locale", { required: true })}>
              {locales.map((locale) => (
                <option key={locale.key} value={locale.key}>
                  {locale.localizedLabel}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl id="role" isInvalid={!!errors.role}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.organization-role-label"
                defaultMessage="Organization role"
              />
            </FormLabel>
            <Select {...register("role", { required: true })}>
              {roles.map((rol) => (
                <option key={rol.role} value={rol.role}>
                  {rol.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
        </Button>
      }
      {...props}
    />
  );
}

InviteUserDialog.queries = [
  gql`
    query InviteUserDialog_emailIsAvailable($email: String!) {
      emailIsAvailable(email: $email)
    }
  `,
];

export function useInviteUserDialog() {
  return useDialog(InviteUserDialog);
}
