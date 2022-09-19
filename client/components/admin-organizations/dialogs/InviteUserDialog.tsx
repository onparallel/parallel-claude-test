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
import { OrganizationRole } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
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

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
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
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            </FormErrorMessage>
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
          <FormControl id="locale" isInvalid={!!errors.locale}>
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

export function useInviteUserDialog() {
  return useDialog(InviteUserDialog);
}
