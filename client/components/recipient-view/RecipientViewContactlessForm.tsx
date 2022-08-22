import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  ScaleFade,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { CheckIcon, QuestionOutlineIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import { RecipientViewPinForm } from "@parallel/components/recipient-view/RecipientViewPinForm";
import {
  RecipientViewContactlessForm_publicCheckVerificationCodeDocument,
  RecipientViewContactlessForm_PublicOrganizationFragment,
  RecipientViewContactlessForm_publicSendReminderDocument,
  RecipientViewContactlessForm_publicSendVerificationCodeDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { resolveUrl } from "@parallel/utils/next";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useCodeExpiredToast } from "@parallel/utils/useCodeExpiredToast";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { isPast } from "date-fns";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { useTone } from "../common/ToneProvider";
import { useRecipientViewContactlessHelpDialog } from "./dialogs/RecipientViewContactlessHelpDialog";

export type RecipientViewContactlessFormData = {
  firstName: string;
  lastName: string;
  email: string;
};

type RecipientViewContactlessState =
  | { step: "FORM" }
  | {
      step: "VERIFY";
      isInvalid?: boolean;
      token: string;
      expiresAt: string;
      remainingAttempts: number;
    }
  | { step: "EMAIL_EXISTS" }
  | { step: "VERIFIED" };

interface RecipientViewContactlessFormProps {
  ownerName: string;
  organization: RecipientViewContactlessForm_PublicOrganizationFragment;
}

export function RecipientViewContactlessForm({
  ownerName,
  organization,
}: RecipientViewContactlessFormProps) {
  const tone = useTone();
  const codeExpiredToast = useCodeExpiredToast();
  const showGenericErrorToast = useGenericErrorToast();
  const toast = useToast();
  const intl = useIntl();
  const router = useRouter();
  const { query } = router;
  const keycode = query.keycode as string;

  const [state, setState] = useState<RecipientViewContactlessState>({
    step: "FORM",
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm<RecipientViewContactlessFormData>();

  const email = watch("email");

  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
  });

  const firstNameRef = useRef<HTMLInputElement>(null);
  const firstNameRegisterProps = useRegisterWithRef(firstNameRef, register, "firstName", {
    required: true,
  });

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.step === "FORM" && email) {
      emailRef.current?.focus();
    }
  }, [state]);

  const [sendVerificationCode, { loading: isSendingCode }] = useMutation(
    RecipientViewContactlessForm_publicSendVerificationCodeDocument
  );

  const [publicCheckVerificationCode, { loading: isVerifyingCode }] = useMutation(
    RecipientViewContactlessForm_publicCheckVerificationCodeDocument
  );

  const [publicSendReminder, { loading: reminderLoading }] = useMutation(
    RecipientViewContactlessForm_publicSendReminderDocument
  );

  const accessSentToast = () => {
    toast({
      title: intl.formatMessage({
        id: "component.recipient-view-contactless-form.access-sent",
        defaultMessage: "Access sent",
      }),
      description: intl.formatMessage(
        {
          id: "component.recipient-view-contactless-form.access-sent-body",
          defaultMessage:
            "We have sent a access to <b>{email}</b> with a link to your ongoing process so you can get back and continue completing it.",
        },
        { email }
      ),
      duration: 5000,
      status: "success",
      isClosable: true,
    });
  };

  const handleSendReminder = async () => {
    try {
      const { data, errors } = await publicSendReminder({
        variables: {
          keycode,
          contactEmail: email,
        },
      });

      if (errors) {
        throw errors;
      }

      if (data?.publicSendReminder === "SUCCESS") {
        accessSentToast();
      } else {
        showGenericErrorToast();
      }
    } catch (error) {
      if (isApolloError(error, "REMINDER_ALREADY_SENT_ERROR")) {
        accessSentToast();
      } else {
        showGenericErrorToast();
      }
    }
  };
  const handleSubmitForm = async ({
    email,
    firstName,
    lastName,
  }: RecipientViewContactlessFormData) => {
    try {
      const { data } = await sendVerificationCode({
        variables: { keycode, email, firstName, lastName },
      });
      if (!data) {
        return;
      }
      setState({
        step: "VERIFY",
        ...omit(data.publicSendVerificationCode, ["__typename"]),
      });
    } catch (error) {
      if (isApolloError(error, "ACCESS_ALREADY_EXISTS")) {
        setState({ step: "EMAIL_EXISTS" });
      } else {
        showGenericErrorToast();
      }
    }
  };
  function codeExpired() {
    codeExpiredToast();
    setState({ step: "FORM" });
  }

  async function handleSubmitCode(code: string) {
    if (state.step !== "VERIFY") {
      return;
    }
    if (isPast(new Date(state.expiresAt))) {
      codeExpired();
    }
    if (state.token && code.length === 6) {
      try {
        const { data } = await publicCheckVerificationCode({
          variables: { keycode, token: state.token, code },
        });
        if (!data) {
          return;
        }
        const { result, remainingAttempts } = data.publicCheckVerificationCode;
        if (result === "SUCCESS") {
          setState({ step: "VERIFIED" });
          router.replace(resolveUrl(`${router.pathname}/1`, router.query));
        } else {
          setState({
            ...state,
            remainingAttempts: remainingAttempts!,
            isInvalid: true,
          });
          if (remainingAttempts === 0) {
            codeExpired();
          }
        }
      } catch {
        codeExpired();
      }
    }
  }

  const handleChangeEmail = () => {
    setState({ step: "FORM" });
  };

  const showRecipientViewContactlessHelpDialog = useRecipientViewContactlessHelpDialog();
  const handleHelpClick = async () => {
    try {
      await showRecipientViewContactlessHelpDialog({ tone });
    } catch {}
  };

  return (
    <Card
      padding={{ base: 6, sm: 8 }}
      paddingBottom={organization.hasRemoveParallelBranding ? undefined : { base: 12, sm: 12 }}
      position="relative"
    >
      <Stack spacing={8}>
        <Box>
          {organization.logoUrl340 ? (
            <Image
              alt={organization.name}
              src={organization.logoUrl340}
              objectFit="contain"
              width="170px"
              height="60px"
            />
          ) : (
            <Logo width="170px" />
          )}
        </Box>

        {state.step === "FORM" ? (
          <Stack as="form" onSubmit={handleSubmit(handleSubmitForm)} spacing={6}>
            <Stack>
              <HStack alignItems="center">
                <Heading fontSize="2xl">
                  <FormattedMessage
                    id="component.recipient-view-contactless-form.heading"
                    defaultMessage="Enter your data to access"
                    values={{ tone }}
                  />
                  <IconButton
                    marginLeft={2}
                    icon={<QuestionOutlineIcon />}
                    aria-label="help"
                    onClick={handleHelpClick}
                    variant="ghost"
                    borderRadius="full"
                    size="xs"
                    fontSize="lg"
                    color="gray.400"
                    _hover={{ color: "gray.600" }}
                    _focus={{ color: "gray.600", outline: "none" }}
                    _focusVisible={{
                      color: "gray.600",
                      shadow: "outline",
                    }}
                  />
                </Heading>
              </HStack>
              <Text>
                <FormattedMessage
                  id="component.recipient-view-contactless-form.has-shared-with-you"
                  defaultMessage="{ownerName} has shared with you this link."
                  values={{
                    ownerName,
                    tone,
                  }}
                />
              </Text>
            </Stack>
            <Stack>
              <FormControl id="firstname" isInvalid={!!errors.firstName}>
                <FormLabel>
                  <FormattedMessage
                    id="generic.forms.first-name-label"
                    defaultMessage="First name"
                  />
                </FormLabel>
                <Input {...firstNameRegisterProps} />
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.invalid-first-name-error"
                    defaultMessage="Please, enter the first name"
                  />
                </FormErrorMessage>
              </FormControl>
              <FormControl id="lastname" isInvalid={!!errors.lastName}>
                <FormLabel>
                  <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
                </FormLabel>
                <Input {...register("lastName", { required: true })} />
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.invalid-last-name-error"
                    defaultMessage="Please, enter the last name"
                  />
                </FormErrorMessage>
              </FormControl>
              <FormControl id="email" isInvalid={!!errors.email}>
                <FormLabel>
                  <FormattedMessage id="generic.forms.email-label" defaultMessage="Email" />
                </FormLabel>
                <Input type="email" {...emailRegisterProps} />
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.invalid-email-error"
                    defaultMessage="Please, enter a valid email"
                  />
                </FormErrorMessage>
              </FormControl>
            </Stack>
            <Button type="submit" colorScheme="primary" isLoading={isSendingCode}>
              <FormattedMessage
                id="component.recipient-view-contactless-form.access"
                defaultMessage="Access"
              />
            </Button>
          </Stack>
        ) : state.step === "EMAIL_EXISTS" ? (
          <Stack spacing={4}>
            <Heading fontSize="2xl">
              <FormattedMessage
                id="component.recipient-view-contactless-form.existing-email"
                defaultMessage="Existing email"
              />
            </Heading>
            <Text>
              <FormattedMessage
                id="component.recipient-view-contactless-form.existing-email-body"
                defaultMessage="There is already an access associated to {email}. You can access again from the previously received mail."
                values={{
                  email: (
                    <Text as="span" fontWeight="bold">
                      {email}
                    </Text>
                  ),
                  tone,
                }}
              />
            </Text>

            <Text>
              <FormattedMessage
                id="component.recipient-view-contactless-form.existing-email-body-question"
                defaultMessage="If you can't find the initial email, we will resend you the access again. What do you want to do?"
                values={{ tone }}
              />
            </Text>
            <HStack wrap="wrap" gridGap={2} spacing={0}>
              <Box flex="1">
                <Button variant="outline" width="full" onClick={handleChangeEmail}>
                  <FormattedMessage
                    id="component.recipient-view-contactless-form.change-email"
                    defaultMessage="Change email"
                  />
                </Button>
              </Box>
              <Box flex="1">
                <Button
                  colorScheme="primary"
                  width="full"
                  isLoading={reminderLoading}
                  onClick={handleSendReminder}
                >
                  <FormattedMessage
                    id="component.recipient-view-contactless-form.resend-access"
                    defaultMessage="Resend access"
                  />
                </Button>
              </Box>
            </HStack>
          </Stack>
        ) : (
          <>
            <Stack spacing={4}>
              <Heading fontSize="2xl">
                <FormattedMessage
                  id="recipient-view.verify-title"
                  defaultMessage="Enter verification code"
                />
              </Heading>
              <Text>
                <FormattedMessage
                  id="recipient-view.verify-2"
                  defaultMessage="To ensure the privacy of your data, we need to verify your identity with a code you will receive on your email {email}."
                  values={{
                    email: (
                      <Text as="span" fontWeight="bold">
                        {email}
                      </Text>
                    ),
                  }}
                />
              </Text>
            </Stack>
            {state.step === "VERIFY" ? (
              <RecipientViewPinForm
                onSubmit={handleSubmitCode}
                isInvalid={state.isInvalid}
                isLoading={isVerifyingCode}
                remainingAttempts={state.remainingAttempts}
              />
            ) : state.step === "VERIFIED" ? (
              <Center height="96px">
                <ScaleFade initialScale={0} in={true}>
                  <Center backgroundColor="green.500" borderRadius="full" boxSize="96px">
                    <CheckIcon color="white" boxSize="64px" />
                  </Center>
                </ScaleFade>
              </Center>
            ) : null}
            <Stack spacing={4}>
              <Text>
                <FormattedMessage
                  id="recipient-view.cant-find-email-help"
                  defaultMessage="<b>Can't find our email?</b> Check your spam folder and if it's not there, contact the person who shared the link with you."
                  values={{ tone }}
                />
              </Text>
              <Button
                variant="link"
                colorScheme="primary"
                onClick={handleChangeEmail}
                width="fit-content"
              >
                <FormattedMessage id="recipient-view.change-email" defaultMessage="Change email" />
              </Button>
            </Stack>
          </>
        )}
      </Stack>
      {organization.hasRemoveParallelBranding ? null : (
        <Box
          position="absolute"
          right={0}
          bottom={0}
          as="a"
          href="/?ref=parallel_public_link"
          target="_blank"
          backgroundColor="gray.200"
          borderTopLeftRadius="xl"
          paddingX={4}
          paddingY={1.5}
          fontSize="sm"
          whiteSpace="nowrap"
        >
          <FormattedMessage
            id="recipient-view.created-with"
            defaultMessage="Created with {parallel}"
            values={{ parallel: <Text as="b">Parallel</Text> }}
          />
        </Box>
      )}
    </Card>
  );
}

RecipientViewContactlessForm.fragments = {
  PublicOrganization: gql`
    fragment RecipientViewContactlessForm_PublicOrganization on PublicOrganization {
      name
      logoUrl340: logoUrl(options: { resize: { width: 340, height: 120, fit: inside } })
      hasRemoveParallelBranding
    }
  `,
};

const _mutations = [
  gql`
    mutation RecipientViewContactlessForm_publicSendVerificationCode(
      $keycode: ID!
      $firstName: String
      $lastName: String
      $email: String
    ) {
      publicSendVerificationCode(
        keycode: $keycode
        firstName: $firstName
        lastName: $lastName
        email: $email
      ) {
        token
        remainingAttempts
        expiresAt
      }
    }
  `,
  gql`
    mutation RecipientViewContactlessForm_publicCheckVerificationCode(
      $keycode: ID!
      $token: ID!
      $code: String!
    ) {
      publicCheckVerificationCode(keycode: $keycode, token: $token, code: $code) {
        result
        remainingAttempts
      }
    }
  `,
  gql`
    mutation RecipientViewContactlessForm_publicSendReminder($keycode: ID, $contactEmail: String!) {
      publicSendReminder(keycode: $keycode, contactEmail: $contactEmail)
    }
  `,
];
