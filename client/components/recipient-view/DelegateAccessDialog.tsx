import {
  Box,
  Button,
  Circle,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { PetitionLocale } from "@parallel/graphql/__types";
import { isEmptyContent } from "@parallel/utils/slate/isEmptyContent";
import { plainTextToContent } from "@parallel/utils/slate/plainTextToContent";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import useMergedRef from "@react-hook/merged-ref";
import outdent from "outdent";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import {
  RichTextEditor,
  RichTextEditorContent,
} from "../common/RichTextEditor";

type DelegateAccessDialogData = {
  email: string;
  firstName: string;
  lastName: string;
  messageBody: RichTextEditorContent;
};

const messages: Record<
  PetitionLocale,
  (organization: string, contactName: string) => string
> = {
  en: (organization, contactName) => outdent`
    Hello,

    I have been asked for this information from ${organization} through Parallel. Could you please help me complete it?

    Thanks,
    ${contactName}.
  `,
  es: (organization, contactName) => outdent`
    Hola,

    Me han pedido esta información de ${organization} a través de Parallel. ¿Podrías ayudarme por favor a completarla?
    
    Gracias,
    ${contactName}.
  `,
};

function DelegateAccessDialog({
  keycode,
  organizationName,
  contactName,
  ...props
}: DialogProps<
  {
    keycode: string;
    contactName: string;
    organizationName: string;
  },
  DelegateAccessDialogData
>) {
  const intl = useIntl();
  const emailRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    register,
    errors,
  } = useForm<DelegateAccessDialogData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      messageBody: plainTextToContent(
        (messages[intl.locale as PetitionLocale] ?? messages["en"])(
          organizationName,
          contactName
        )
      ),
    },
    shouldFocusError: true,
  });

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={emailRef as any}
      hasCloseButton
      {...props}
      content={{
        as: "form",
        onSubmit: handleSubmit<DelegateAccessDialogData>(props.onResolve),
      }}
      header={
        <Stack direction="row">
          <Circle
            role="presentation"
            size="32px"
            backgroundColor="purple.500"
            color="white"
          >
            <UserArrowIcon />
          </Circle>
          <Text as="div" flex="1">
            <FormattedMessage
              id="recipient-view.delegate-access"
              defaultMessage="Delegate access"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack>
          <Box fontSize="sm" fontStyle="italic">
            <Text>
              <FormattedMessage
                id="recipient-view.delegate-access-dialog.subtitle-1"
                defaultMessage="Please fill out the contact details of the person you want to delegate your access."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="recipient-view.delegate-access-dialog.subtitle-2"
                defaultMessage="We will send them an email with instructions on how to proceed."
              />
            </Text>
          </Box>
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
            {errors.email && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-email-error"
                  defaultMessage="Please, enter a valid email"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="contact-first-name" isInvalid={!!errors.firstName}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.first-name-label"
                defaultMessage="First name"
              />
            </FormLabel>
            <Input name="firstName" ref={register({ required: true })} />
            {errors.firstName && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-contact-first-name-error"
                  defaultMessage="Please, enter the contact first name"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="contact-last-name" isInvalid={!!errors.lastName}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.last-name-label"
                defaultMessage="Last name"
              />
            </FormLabel>
            <Input name="lastName" ref={register({ required: true })} />
            {errors.lastName && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-contact-last-name-error"
                  defaultMessage="Please, enter the contact last name"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="message" isInvalid={!!errors.messageBody}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.message-label"
                defaultMessage="Message"
              />
            </FormLabel>
            <Controller
              name="messageBody"
              control={control}
              rules={{
                validate: { required: (value) => !isEmptyContent(value) },
              }}
              render={({ value, onChange }) => (
                <RichTextEditor
                  value={value}
                  onChange={onChange}
                  placeholder={intl.formatMessage({
                    id: "component.message-email-editor.body-placeholder",
                    defaultMessage: "Write a message to include in the email",
                  })}
                />
              )}
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

export function useDelegateAccessDialog() {
  return useDialog(DelegateAccessDialog);
}
