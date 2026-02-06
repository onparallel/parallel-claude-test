import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
} from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { Button, Text } from "@parallel/components/ui";
import {
  Tone,
  useDelegateAccessDialog_publicDelegateAccessToContactDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { isValidEmail } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface DelegateAccessDialogData {
  email: string;
  firstName: string;
  lastName: string;
  messageBody: string;
}

function DelegateAccessDialog({
  keycode,
  organizationName,
  contactName,
  tone,
  ...props
}: DialogProps<
  { keycode: string; contactName: string; organizationName: string; tone: Tone },
  DelegateAccessDialogData
>) {
  const intl = useIntl();

  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
  } = useForm<DelegateAccessDialogData>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      messageBody: intl.formatMessage(
        {
          id: "component.delegate-access-dialog.default-message-body",
          defaultMessage:
            // eslint-disable-next-line formatjs/no-multiple-whitespaces
            "Hello,\n\nI have been asked for this information from {organization} through Parallel. Could you please help me complete it?\n\nThanks,\n{contact}",
        },
        { organization: organizationName, contact: contactName },
      ),
    },
    shouldFocusError: true,
  });

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    validate: { isValidEmail },
  });

  const [publicDelegateAccessToContact] = useMutation(
    useDelegateAccessDialog_publicDelegateAccessToContactDocument,
  );

  const showError = useGenericErrorToast();

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={emailRef}
      hasCloseButton
      {...props}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            try {
              await publicDelegateAccessToContact({
                variables: {
                  ...data,
                  keycode,
                },
              });

              props.onResolve();
            } catch (e) {
              if (isApolloError(e, "ARG_VALIDATION_ERROR")) {
                setError("email", { type: "invalid" });
              } else {
                showError();
              }
            }
          }),
        },
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
              <FormattedMessage id="generic.forms-email-label" defaultMessage="Email" />
            </FormLabel>
            <Input
              {...emailRegisterProps}
              type="email"
              name="email"
              placeholder={intl.formatMessage({
                id: "generic.forms-email-placeholder",
                defaultMessage: "name@example.com",
              })}
            />

            {errors.email && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms-invalid-email-error"
                  defaultMessage="Please, enter a valid email"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="contact-first-name" isInvalid={!!errors.firstName}>
            <FormLabel fontWeight={400}>
              <FormattedMessage id="generic.forms-first-name-label" defaultMessage="First name" />
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
              <FormattedMessage id="generic.forms-last-name-label" defaultMessage="Last name" />
            </FormLabel>
            <Input {...register("lastName", { required: true })} />
            {errors.lastName && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms-invalid-last-name-error"
                  defaultMessage="Please, enter the last name"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl isInvalid={!!errors.messageBody} id="delegate-access-message">
            <GrowingTextarea
              {...register("messageBody", {
                required: true,
              })}
              aria-label={intl.formatMessage({
                id: "generic.email-message-placeholder",
                defaultMessage: "Write a message to include in the email",
              })}
              placeholder={intl.formatMessage({
                id: "generic.email-message-placeholder",
                defaultMessage: "Write a message to include in the email",
              })}
              maxLength={1_000}
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
        <Button type="submit" colorPalette="primary" variant="solid">
          <FormattedMessage id="generic.send" defaultMessage="Send" />
        </Button>
      }
    />
  );
}

export function useDelegateAccessDialog() {
  return useDialog(DelegateAccessDialog);
}

const _mutations = [
  gql`
    mutation useDelegateAccessDialog_publicDelegateAccessToContact(
      $keycode: ID!
      $email: String!
      $firstName: String!
      $lastName: String!
      $messageBody: String!
    ) {
      publicDelegateAccessToContact(
        keycode: $keycode
        email: $email
        firstName: $firstName
        lastName: $lastName
        messageBody: $messageBody
      ) {
        petition {
          id
          recipients {
            id
            fullName
            email
          }
        }
      }
    }
  `,
];
