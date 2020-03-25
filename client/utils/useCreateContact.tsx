import { useMutation } from "@apollo/react-hooks";
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
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import {
  useCreateContact_createContactMutation,
  useCreateContact_createContactMutationVariables,
} from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { EMAIL_REGEX } from "./validation";

export function useCreateContact() {
  const [createContact] = useMutation<
    useCreateContact_createContactMutation,
    useCreateContact_createContactMutationVariables
  >(
    gql`
      mutation useCreateContact_createContact($data: CreateContactInput!) {
        createContact(data: $data) {
          id
        }
      }
    `
  );

  const askContactDetails = useDialog(AskContactDetails, []);

  return useCallback(async function () {
    const details = await askContactDetails({});

    const { data, errors } = await createContact({
      variables: { data: details },
    });
    if (errors) {
      throw errors;
    }
    return data!.createContact.id;
  }, []);
}

type ContactDetailsFormData = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

function AskContactDetails(props: DialogCallbacks<ContactDetailsFormData>) {
  const intl = useIntl();
  const { handleSubmit, register, errors } = useForm<ContactDetailsFormData>({
    defaultValues: { email: "", firstName: "", lastName: "" },
  });
  const focusRef = useRef<HTMLInputElement>(null);
  const emailRef = register({ required: true, pattern: EMAIL_REGEX });

  function onCreateContact(data: ContactDetailsFormData) {
    props.onResolve({
      email: data.email,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
    });
  }

  return (
    <ConfirmDialog
      focusRef={focusRef}
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
              ref={emailRef}
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
                ></FormattedMessage>
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
            <Input id="contact-first-name" name="firstName" ref={register()} />
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
        <Button variantColor="purple" type="submit">
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
