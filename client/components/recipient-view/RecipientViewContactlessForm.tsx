import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  ScaleFade,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CheckIcon, QuestionOutlineIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { RecipientViewPinForm } from "@parallel/components/recipient-view/RecipientViewPinForm";
import {
  RecipientViewContactlessForm_publicCheckVerificationCodeDocument,
  RecipientViewContactlessForm_publicSendVerificationCodeDocument,
} from "@parallel/graphql/__types";
import { resolveUrl } from "@parallel/utils/next";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useCodeExpiredToast } from "@parallel/utils/useCodeExpiredToast";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { isPast } from "date-fns";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
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
  | { step: "VERIFIED" };

export function RecipientViewContactlessForm({
  ownerName,
  orgLogoUrl,
  orgName,
}: {
  ownerName: string;
  orgLogoUrl: string;
  orgName: string;
}) {
  const tone = useTone();
  const codeExpiredToast = useCodeExpiredToast();

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
  }, [firstNameRef]);

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
    } catch {}
  };
  function codeExpired() {
    codeExpiredToast();
    setState({ step: "FORM" });
  }

  async function handleSubmitCode(code: string) {
    if (state.step === "FORM" || state.step === "VERIFIED") {
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
      padding={{ base: 4, sm: 8 }}
      paddingTop={8}
      paddingBottom={{ base: 12, sm: 14 }}
      position="relative"
    >
      <Stack spacing={8}>
        <Box>
          {orgLogoUrl ? (
            <Box
              role="img"
              aria-label={orgName}
              width="170px"
              margin="auto"
              height="60px"
              backgroundImage={`url("${orgLogoUrl}")`}
              backgroundSize="contain"
              backgroundPosition="center"
              backgroundRepeat="no-repeat"
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
                    values={{
                      tone,
                    }}
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
                  defaultMessage="{ownerName} has shared with you an access to Parallel."
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
      <Flex justifyContent="flex-end" position="absolute" right={0} bottom={0}>
        <NakedLink href="/?ref=parallel_public_link">
          <Box
            as="a"
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
        </NakedLink>
      </Flex>
    </Card>
  );
}

RecipientViewContactlessForm.mutations = [
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
];
