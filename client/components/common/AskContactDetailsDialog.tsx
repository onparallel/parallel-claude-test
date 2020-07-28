import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { useMergeRefs } from "../../utils/useMergeRefs";
import { EMAIL_REGEX } from "../../utils/validation";

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
  const { handleSubmit, register, errors } = useForm<ContactDetailsFormData>({
    defaultValues: { email: defaultEmail ?? "", firstName: "", lastName: "" },
  });
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  function onCreateContact(data: ContactDetailsFormData) {
    props.onResolve({
      email: data.email,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
    });
  }
  return (
    <ConfirmDialog
      closeOnOverlayClick={false}
      initialFocusRef={defaultEmail ? nameRef : emailRef}
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
              ref={useMergeRefs(
                emailRef,
                register({ required: true, pattern: EMAIL_REGEX })
              )}
              name="email"
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
            <Input name="firstName" ref={useMergeRefs(register(), nameRef)} />
          </FormControl>
          <FormControl id="contact-last-name">
            <FormLabel>
              <FormattedMessage
                id="generic.forms.last-name-label"
                defaultMessage="Last name"
              />
            </FormLabel>
            <Input name="lastName" ref={register()} />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage
            id="contacts.create-new-contact.continue-button"
            defaultMessage="Continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useAskContactDetailsDialog() {
  return useDialog(AskContactDetailsDialog);
}
