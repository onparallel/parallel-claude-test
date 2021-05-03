import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

export type ContactDetailsFormData = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type AskContactDetailsDialogResult = {
  defaultEmail?: string;
};

export function AskContactDetailsDialog({
  defaultEmail,
  ...props
}: DialogProps<AskContactDetailsDialogResult, ContactDetailsFormData>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ContactDetailsFormData>({
    defaultValues: { email: defaultEmail ?? "", firstName: "", lastName: "" },
  });
  function onCreateContact(data: ContactDetailsFormData) {
    props.onResolve({
      email: data.email,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
    });
  }

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
  });

  const firstNameRef = useRef<HTMLInputElement>(null);
  const firstNameRegisterProps = useRegisterWithRef(
    firstNameRef,
    register,
    "firstName"
  );
  return (
    <ConfirmDialog
      id="pw-add-contact"
      closeOnOverlayClick={false}
      initialFocusRef={defaultEmail ? firstNameRef : emailRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(onCreateContact),
      }}
      header={
        <FormattedMessage
          id="contacts.create-new-contact.header"
          defaultMessage="Enter the contact details"
        />
      }
      body={
        <Stack>
          <FormControl id="contact-email" isInvalid={!!errors.email}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.email-label"
                defaultMessage="Email"
              />
            </FormLabel>
            <Input
              {...emailRegisterProps}
              type="email"
              placeholder={intl.formatMessage({
                id: "generic.forms.email-placeholder",
                defaultMessage: "name@example.com",
              })}
            />
            {errors.email && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-email-error"
                  defaultMessage="Please, enter a valid email"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="contact-first-name">
            <FormLabel>
              <FormattedMessage
                id="generic.forms.first-name-label"
                defaultMessage="First name"
              />
            </FormLabel>
            <Input {...firstNameRegisterProps} />
          </FormControl>
          <FormControl id="contact-last-name">
            <FormLabel>
              <FormattedMessage
                id="generic.forms.last-name-label"
                defaultMessage="Last name"
              />
            </FormLabel>
            <Input {...register("lastName")} />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit" id="create-contact-submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useAskContactDetailsDialog() {
  return useDialog(AskContactDetailsDialog);
}
