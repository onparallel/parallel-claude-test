import { FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button } from "@parallel/components/ui";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { isNotEmptyText } from "@parallel/utils/strings";
import { isValidEmail } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

export interface ContactDetailsFormData {
  email: string;
  firstName: string;
  lastName: string | null;
}

export interface AskContactDetailsDialogProps {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export function AskContactDetailsDialog({
  email,
  firstName,
  lastName,
  ...props
}: DialogProps<AskContactDetailsDialogProps, ContactDetailsFormData>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ContactDetailsFormData>({
    defaultValues: { email: email ?? "", firstName: firstName ?? "", lastName: lastName ?? "" },
  });
  function onCreateContact(data: ContactDetailsFormData) {
    props.onResolve({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName || null,
    });
  }

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    validate: { isValidEmail },
  });

  const firstNameRef = useRef<HTMLInputElement>(null);
  const firstNameRegisterProps = useRegisterWithRef(firstNameRef, register, "firstName", {
    required: true,
    validate: { isNotEmptyText },
  });
  return (
    <ConfirmDialog
      hasCloseButton
      closeOnOverlayClick={false}
      initialFocusRef={email ? firstNameRef : emailRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(onCreateContact),
        },
      }}
      header={
        <FormattedMessage
          id="component.ask-contact-details-dialog.header"
          defaultMessage="Enter the contact details"
        />
      }
      body={
        <Stack>
          <FormControl id="contact-email" isInvalid={!!errors.email}>
            <FormLabel fontWeight={400}>
              <FormattedMessage id="generic.forms-email-label" defaultMessage="Email" />
            </FormLabel>
            <Input
              {...emailRegisterProps}
              type="email"
              data-testid="create-contact-email-input"
              placeholder={intl.formatMessage({
                id: "generic.forms-email-placeholder",
                defaultMessage: "name@example.com",
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms-invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="contact-first-name" isInvalid={!!errors.firstName}>
            <FormLabel fontWeight={400}>
              <FormattedMessage id="generic.forms-first-name-label" defaultMessage="First name" />
            </FormLabel>
            <Input data-testid="create-contact-first-name-input" {...firstNameRegisterProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.invalid-first-name-error"
                defaultMessage="Please, enter the first name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="contact-last-name">
            <FormLabel fontWeight={400}>
              <FormattedMessage id="generic.forms-last-name-label" defaultMessage="Last name" />
            </FormLabel>
            <Input data-testid="create-contact-last-name-input" {...register("lastName")} />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorPalette="primary" type="submit" data-testid="create-contact-button">
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
