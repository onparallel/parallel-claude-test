import { gql } from "@apollo/client";
import {
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  PetitionLocale,
  useCompleteSignerInfoDialog_PublicContactFragment,
} from "@parallel/graphql/__types";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import useMergedRef from "@react-hook/merged-ref";
import outdent from "outdent";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { GrowingTextarea } from "../common/GrowingTextarea";

type CompleteSignerInfoDialogData = {
  signer: "myself" | "other" | null;
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
  contact,
  organization,
  ...props
}: DialogProps<
  {
    keycode: string;
    contact: useCompleteSignerInfoDialog_PublicContactFragment;
    organization: string;
  },
  Omit<CompleteSignerInfoDialogData, "signer">
>) {
  const intl = useIntl();
  const emailRef = useRef<HTMLInputElement>(null);
  const {
    handleSubmit,
    register,
    errors,
    control,
    watch,
  } = useForm<CompleteSignerInfoDialogData>({
    mode: "onChange",
    defaultValues: {
      signer: null,
      message: messages[intl.locale as PetitionLocale](
        organization,
        contact.firstName ?? ""
      ),
    },
    shouldFocusError: true,
  });

  const [showMessage, setShowMessage] = useState(true);
  const signer = watch("signer");

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={emailRef as any}
      hasCloseButton
      {...props}
      content={{
        as: "form",
        onSubmit: handleSubmit<CompleteSignerInfoDialogData>((data) => {
          if (data.signer === "myself") {
            props.onResolve({
              email: contact.email,
              firstName: contact.firstName ?? "",
              lastName: contact.lastName ?? "",
              message: null,
            });
          } else {
            props.onResolve({
              ...omit(data, ["signer"]),
              message: showMessage ? data.message : null,
            });
          }
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
            defaultMessage="An eSignature is required to complete this petition."
          />
          <FormControl id="signer" isInvalid={!!errors.signer} marginTop={4}>
            <FormLabel>
              <Text fontWeight="bold">
                <FormattedMessage
                  id="recipient-view.complete-signer-info-dialog.who-will-sign"
                  defaultMessage="Who has to sign the document?"
                />
              </Text>
            </FormLabel>
            <Controller
              name="signer"
              control={control}
              rules={{ required: true }}
              render={({ onChange, value }) => (
                <RadioGroup onChange={onChange} value={value}>
                  <Stack>
                    <Radio
                      id="signer-option-1"
                      value="myself"
                      isChecked={signer === "myself"}
                      isInvalid={!!errors.signer}
                    >
                      <FormattedMessage
                        id="recipient-view.complete-signer-info-dialog.who-will-sign.myself"
                        defaultMessage="I will sign ({email})"
                        values={{ email: contact.email }}
                      />
                    </Radio>
                    <Radio
                      id="signer-option-2"
                      value="other"
                      isChecked={signer === "other"}
                      isInvalid={!!errors.signer}
                    >
                      <FormattedMessage
                        id="recipient-view.complete-signer-info-dialog.who-will-sign.other"
                        defaultMessage="Another person will sign"
                      />
                    </Radio>
                  </Stack>
                </RadioGroup>
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.radiogroup-error"
                defaultMessage="Please, choose an option"
              />
            </FormErrorMessage>
          </FormControl>

          <Collapse in={signer === "other"}>
            <FormControl
              id="contact-email"
              isInvalid={signer === "other" && !!errors.email}
            >
              <FormLabel>
                <FormattedMessage
                  id="generic.forms.email-label"
                  defaultMessage="Email"
                />
              </FormLabel>
              <Input
                ref={useMergedRef(
                  emailRef,
                  register({
                    required: signer === "other",
                    pattern: EMAIL_REGEX,
                  })
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
            <Stack direction="row" marginTop={2}>
              <FormControl
                id="contact-first-name"
                isInvalid={!!errors.firstName}
              >
                <FormLabel>
                  <FormattedMessage
                    id="generic.forms.first-name-label"
                    defaultMessage="First name"
                  />
                </FormLabel>
                <Input
                  name="firstName"
                  ref={register({ required: signer === "other" })}
                />
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
                <Input
                  name="lastName"
                  ref={register({ required: signer === "other" })}
                />
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.invalid-contact-last-name-error"
                    defaultMessage="Please, enter the contact last name"
                  />
                </FormErrorMessage>
              </FormControl>
            </Stack>
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
            <Collapse in={showMessage}>
              <FormControl isInvalid={showMessage && !!errors.message}>
                <GrowingTextarea
                  name="message"
                  ref={register({
                    required: signer === "other" && showMessage,
                  })}
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
            </Collapse>
          </Collapse>
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

useCompleteSignerInfoDialog.fragments = {
  PublicContact: gql`
    fragment useCompleteSignerInfoDialog_PublicContact on PublicContact {
      firstName
      lastName
      email
    }
  `,
};

export function useCompleteSignerInfoDialog() {
  return useDialog(CompleteSignerInfoDialog);
}
