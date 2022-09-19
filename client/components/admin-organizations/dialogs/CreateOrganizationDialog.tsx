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
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { OrganizationStatus, PetitionLocale } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface CreateOrganizationDialogData {
  email: string;
  firstName: string;
  lastName: string;
  locale: PetitionLocale;
  name: string;
  status: OrganizationStatus;
}

export function CreateOrganizationDialog({
  ...props
}: DialogProps<{}, CreateOrganizationDialogData>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CreateOrganizationDialogData>({
    mode: "onSubmit",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      locale: (intl.locale as PetitionLocale) || "en",
      name: "",
      status: "ACTIVE",
    },
  });

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
  });

  const locales = useSupportedLocales();
  const status = ["ACTIVE", "CHURNED", "DEMO", "DEV", "ROOT"] as OrganizationStatus[];

  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      initialFocusRef={emailRef}
      header={
        <Text>
          <FormattedMessage
            id="component.create-organization-dialog.create-organization"
            defaultMessage="Create organization"
          />
        </Text>
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
          <Stack direction={{ base: "column", md: "row" }}>
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
          </Stack>

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

          <FormControl id="name" isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage
                id="component.create-organization-dialog.organization-name"
                defaultMessage="Organization name"
              />
            </FormLabel>
            <Input {...register("name", { required: true })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.required-field-error"
                defaultMessage="The field is required"
              />
            </FormErrorMessage>
          </FormControl>

          <FormControl id="status" isInvalid={!!errors.status}>
            <FormLabel>
              <FormattedMessage
                id="component.create-organization-dialog.organization-status"
                defaultMessage="Organization status"
              />
            </FormLabel>
            <Select {...register("status", { required: true })}>
              {status.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage
            id="component.create-organization-dialog.create-organization"
            defaultMessage="Create organization"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreateOrganizationDialog() {
  return useDialog(CreateOrganizationDialog);
}
