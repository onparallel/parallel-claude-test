import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { RichTextEditor } from "@parallel/components/common/slate/RichTextEditor";
import { PetitionLocale, Tone } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { plainTextToRTEValue } from "@parallel/utils/slate/RichTextEditor/plainTextToRTEValue";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import outdent from "outdent";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface DelegateAccessDialogData {
  email: string;
  firstName: string;
  lastName: string;
  messageBody: any;
}

const messages: Record<PetitionLocale, (organization: string, contactName: string) => string> = {
  ca: (organization, contactName) => outdent`
    Hola,
  
    M'han demanat aquesta informació de ${organization} a través de Parallel. Podries ajudar-me, si us plau, a completar-la?
    
    Gràcies,
    ${contactName}.
  `,
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
  it: (organization, contactName) => outdent`
    Ciao,

    Mi hanno chiesto queste informazioni su ${organization} tramite Parallel. Potresti aiutarmi a completarle, per favore?
    
    Grazie,
    ${contactName}.
  `,
  pt: (organization, contactName) => outdent`
    Olá,
  
    Foi-me solicitada esta informação sobre a ${organization} através da Parallel. Poderia ajudar-me a completá-la, por favor?
  
    Obrigado,
    ${contactName}.
  `,
};

function DelegateAccessDialog({
  keycode,
  organizationName,
  contactName,
  tone,
  ...props
}: DialogProps<
  {
    keycode: string;
    contactName: string;
    organizationName: string;
    tone: Tone;
  },
  DelegateAccessDialogData
>) {
  const intl = useIntl();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<DelegateAccessDialogData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      messageBody: plainTextToRTEValue(
        (messages[intl.locale as PetitionLocale] ?? messages["en"])(organizationName, contactName),
      ),
    },
    shouldFocusError: true,
  });

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
  });

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={emailRef}
      hasCloseButton
      {...props}
      content={{
        as: "form",
        onSubmit: handleSubmit(props.onResolve),
      }}
      header={
        <HStack spacing={2.5}>
          <UserArrowIcon />
          <Text as="div" flex="1">
            <FormattedMessage id="generic.share" defaultMessage="Share" />
          </Text>
        </HStack>
      }
      body={
        <Stack spacing={4}>
          <Box>
            <Text>
              <FormattedMessage
                id="component.delegate-access-dialog.invite-collaborator-subtitle"
                defaultMessage="Invite a collaborator to complete or review the missing information."
                values={{ tone }}
              />
            </Text>
          </Box>
          <FormControl id="contact-email" isInvalid={!!errors.email}>
            <FormLabel fontWeight={400}>
              <FormattedMessage id="generic.forms.email-label" defaultMessage="Email" />
            </FormLabel>
            <Input
              {...emailRegisterProps}
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
            <FormLabel fontWeight={400}>
              <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
            </FormLabel>
            <Input {...register("firstName", { required: true })} />
            {errors.firstName && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.invalid-first-name-error"
                  defaultMessage="Please, enter the first name"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="contact-last-name" isInvalid={!!errors.lastName}>
            <FormLabel fontWeight={400}>
              <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
            </FormLabel>
            <Input {...register("lastName", { required: true })} />
            {errors.lastName && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-last-name-error"
                  defaultMessage="Please, enter the last name"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl isInvalid={!!errors.messageBody} id="delegate-access-message">
            <Controller
              name="messageBody"
              control={control}
              rules={{
                validate: { required: (value) => !isEmptyRTEValue(value) },
              }}
              render={({ field: { value, onChange } }) => (
                <RichTextEditor
                  value={value}
                  onChange={onChange}
                  placeholder={intl.formatMessage({
                    id: "generic.email-message-placeholder",
                    defaultMessage: "Write a message to include in the email",
                  })}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.message-email-body-form-control.required-error"
                defaultMessage="Customizing the initial message improves the response time of the recipients"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.send" defaultMessage="Send" />
        </Button>
      }
    />
  );
}

export function useDelegateAccessDialog() {
  return useDialog(DelegateAccessDialog);
}
