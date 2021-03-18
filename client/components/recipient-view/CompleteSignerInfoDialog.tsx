import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import { PetitionLocale } from "@parallel/graphql/__types";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import useMergedRef from "@react-hook/merged-ref";
import outdent from "outdent";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { GrowingTextarea } from "../common/GrowingTextarea";

type CompleteSignerInfoDialogData = {
  email: string;
  firstName: string;
  lastName: string;
  message: string | null;
};

const messages: Record<
  PetitionLocale,
  (organization: string, contactName: string) => string
> = {
  en: (organization, contactName) => outdent`
  Hello,

  I have completed this document requested by ${organization} through Parallel. Could you please sign it?

  Thanks,
  ${contactName}.
`,
  es: (organization, contactName) => outdent`
  Hola,

  He completado este documento que nos han pedido de ${organization} a través de Parallel. ¿Podrías por favor firmarlo?
  
  Gracias,
  ${contactName}.
`,
};

function CompleteSignerInfoDialog({
  keycode,
  contactName,
  organization,
  ...props
}: DialogProps<
  { keycode: string; contactName: string; organization: string },
  CompleteSignerInfoDialogData
>) {
  const intl = useIntl();
  const emailRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    register,
    errors,
  } = useForm<CompleteSignerInfoDialogData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      message: messages[intl.locale as PetitionLocale](
        organization,
        contactName
      ),
    },
    shouldFocusError: true,
  });

  const [showMessage, setShowMessage] = useState(true);

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={emailRef as any}
      hasCloseButton
      {...props}
      content={{
        as: "form",
        onSubmit: handleSubmit<CompleteSignerInfoDialogData>((data) => {
          props.onResolve({
            ...data,
            message: showMessage ? data.message : null,
          });
        }),
      }}
      header={
        <FormattedMessage
          id="recipient-view.complete-signer-info-dialog.header"
          defaultMessage="Sign petition"
        />
      }
      body={
        <Stack>
          <FormattedMessage
            id="recipient-view.complete-signer-info-dialog.subtitle"
            defaultMessage="An eSignature is required to complete this petition. <b>Who has to sign the document?</b>"
            values={{
              b: (chunks: any[]) => <b>{chunks}</b>,
            }}
          />
          <FormControl id="contact-email" isInvalid={!!errors.email}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.email-label"
                defaultMessage="Email"
              />
            </FormLabel>
            <Input
              ref={useMergedRef(
                emailRef,
                register({ required: true, pattern: EMAIL_REGEX })
              )}
              type="email"
              name="email"
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
          <FormControl id="contact-first-name" isInvalid={!!errors.firstName}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.first-name-label"
                defaultMessage="First name"
              />
            </FormLabel>
            <Input name="firstName" ref={register({ required: true })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-contact-first-name-error"
                defaultMessage="Please, enter the contact first name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="contact-last-name" isInvalid={!!errors.lastName}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.last-name-label"
                defaultMessage="Last name"
              />
            </FormLabel>
            <Input name="lastName" ref={register({ required: true })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-contact-last-name-error"
                defaultMessage="Please, enter the contact last name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel marginTop={2} />
            <Checkbox
              colorScheme="purple"
              isChecked={showMessage}
              onChange={(e) => setShowMessage(e.target.checked)}
            >
              <FormattedMessage
                id="generic.add-message"
                defaultMessage="Add message"
              />
            </Checkbox>
          </FormControl>
          <FormControl
            hidden={!showMessage}
            isInvalid={showMessage && !!errors.message}
          >
            <GrowingTextarea
              name="message"
              ref={register({ required: showMessage })}
              placeholder={intl.formatMessage({
                id: "component.message-email-editor.body-placeholder",
                defaultMessage: "Write a message to include in the email",
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.message-email-editor.body-required-error"
                defaultMessage="Customizing the initial message improves the response time of the recipients"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          <FormattedMessage id="generic.send" defaultMessage="Send" />
        </Button>
      }
    />
  );
}

export function useCompleteSignerInfoDialog() {
  return useDialog(CompleteSignerInfoDialog);
}
