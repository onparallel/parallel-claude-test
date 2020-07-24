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

export function AskContactDetailsDialog({
  defaultEmail,
  ...props
}: {
  defaultEmail?: string;
} & DialogProps<ContactDetailsFormData>) {
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
      focusRef={defaultEmail ? nameRef : emailRef}
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
          <FormControl isInvalid={!!errors.email}>
            <FormLabel htmlFor="contact-email">
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
              id="contact-email"
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
          <FormControl>
            <FormLabel htmlFor="contact-first-name">
              <FormattedMessage
                id="generic.forms.first-name-label"
                defaultMessage="First name"
              />
            </FormLabel>
            <Input
              id="contact-first-name"
              name="firstName"
              ref={useMergeRefs(register(), nameRef)}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="contact-last-name">
              <FormattedMessage
                id="generic.forms.last-name-label"
                defaultMessage="Last name"
              />
            </FormLabel>
            <Input id="contact-last-name" name="lastName" ref={register()} />
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
