import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  useToast
} from "@chakra-ui/core";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicUserFormContainer } from "@parallel/components/public/PublicUserContainer";
import { Title } from "@parallel/components/common/Title";
import languages from "@parallel/lang/languages.json";
import { postJson } from "@parallel/utils/rest";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { useRouter } from "next/router";

interface ForgotPasswordFormData {
  email: string;
}

function Forgot() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verification, setVerification] = useState<{
    sent: boolean;
    email?: string;
    verificationCodeError?: boolean;
  }>({ sent: false });
  const router = useRouter();
  const intl = useIntl();
  const toast = useToast();

  async function onForgotPasswordSubmit({ email }: ForgotPasswordFormData) {
    setIsSubmitting(true);
    try {
      await postJson("/api/auth/forgot-password", {
        email
      });
      setVerification({ sent: true, email });
      toast({
        title: intl.formatMessage({
          id: "public.forgot-password.toast-title",
          defaultMessage: "Reset your password"
        }),
        description: intl.formatMessage({
          id: "public.forgot-password.toast-description",
          defaultMessage:
            "An email is on its way to you with a verification code."
        }),
        status: "success",
        isClosable: true
      });
    } catch (error) {}
    setIsSubmitting(false);
  }

  async function onPasswordResetSubmit({
    verificationCode,
    password1: newPassword
  }: PasswordResetFormData) {
    setIsSubmitting(true);
    setVerification({ ...verification, verificationCodeError: false });
    try {
      await postJson("/api/auth/confirm-forgot-password", {
        email: verification.email,
        verificationCode,
        newPassword
      });
      toast({
        title: intl.formatMessage({
          id: "public.forgot-password.reset-success-toast-title",
          defaultMessage: "Password reset"
        }),
        description: intl.formatMessage({
          id: "public.forgot-password.reset-success-toast-description",
          defaultMessage: "Your password has been reset successfully."
        }),
        status: "success",
        isClosable: true
      });
      router.push("/[locale]/login", `/${router.query.locale}/login`);
    } catch (error) {
      setVerification({ ...verification, verificationCodeError: true });
    }
    setIsSubmitting(false);
  }

  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "public.forgot.title",
          defaultMessage: "Forgot password"
        })}
      </Title>
      <PublicLayout>
        <PublicUserFormContainer>
          {verification.sent ? (
            <PasswordResetForm
              onSubmit={onPasswordResetSubmit}
              onBackToForgotPassword={() => setVerification({ sent: false })}
              verificationCodeError={!!verification.verificationCodeError}
              isSubmitting={isSubmitting}
            ></PasswordResetForm>
          ) : (
            <ForgotPasswordForm
              onSubmit={onForgotPasswordSubmit}
              isSubmitting={isSubmitting}
            ></ForgotPasswordForm>
          )}
        </PublicUserFormContainer>
      </PublicLayout>
    </>
  );
}

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  isSubmitting: boolean;
}

function ForgotPasswordForm({
  onSubmit,
  isSubmitting
}: ForgotPasswordFormProps) {
  const { handleSubmit, register, errors } = useForm<ForgotPasswordFormData>();
  return (
    <>
      <Box marginBottom={6} textAlign="center">
        <Heading marginTop={4} marginBottom={2} fontSize="lg">
          <FormattedMessage
            id="public.forgot-password.header"
            defaultMessage="Forgot password"
          ></FormattedMessage>
        </Heading>
        <Text>
          <FormattedMessage
            id="public.forgot-password.explanation"
            defaultMessage="We will send you a message to reset your password."
          ></FormattedMessage>
        </Text>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormControl isInvalid={!!errors.email}>
          <FormLabel htmlFor="email">
            <FormattedMessage
              id="generic.forms.email-label"
              defaultMessage="Email"
            ></FormattedMessage>
          </FormLabel>
          <Input
            id="email"
            name="email"
            type="email"
            ref={register({
              required: true,
              pattern: EMAIL_REGEX
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
        <Button
          mt={6}
          width="100%"
          variantColor="purple"
          isLoading={isSubmitting}
          type="submit"
        >
          <FormattedMessage
            id="public.forgot-password.send-button"
            defaultMessage="Send verification code"
          ></FormattedMessage>
        </Button>
      </form>
      <Box marginTop={4} textAlign="center">
        <Link href="/login">
          <FormattedMessage
            id="public.forgot-password.login-link"
            defaultMessage="I remembered my password"
          ></FormattedMessage>
        </Link>
      </Box>
    </>
  );
}

interface PasswordResetFormData {
  verificationCode: string;
  password1: string;
  password2: string;
}

interface PasswordResetFormProps {
  onSubmit: (data: PasswordResetFormData) => Promise<void>;
  onBackToForgotPassword: () => void;
  verificationCodeError: boolean;
  isSubmitting: boolean;
}

function PasswordResetForm({
  onSubmit,
  onBackToForgotPassword,
  verificationCodeError,
  isSubmitting
}: PasswordResetFormProps) {
  const {
    handleSubmit,
    register,
    errors,
    getValues,
    setError,
    clearError
  } = useForm<PasswordResetFormData>({ mode: "onBlur" });
  useEffect(() => {
    if (verificationCodeError) {
      setError("verificationCode", "validate");
    } else {
      clearError("verificationCode");
    }
  }, [verificationCodeError]);
  return (
    <>
      <Box marginBottom={6} textAlign="center">
        <Heading marginTop={4} marginBottom={2} fontSize="lg">
          <FormattedMessage
            id="public.forgot-password.reset-header"
            defaultMessage="Password reset"
          ></FormattedMessage>
        </Heading>
        <Text>
          <FormattedMessage
            id="public.forgot-password.reset-explanation"
            defaultMessage="Use the verification code in the email you have received."
          ></FormattedMessage>
        </Text>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormControl isInvalid={!!errors.verificationCode}>
          <FormLabel htmlFor="verification-code">
            <FormattedMessage
              id="generic.forms.verification-code-label"
              defaultMessage="Verification code"
            ></FormattedMessage>
          </FormLabel>
          <Input
            id="verification-code"
            name="verificationCode"
            ref={register({ required: true })}
          />
          {errors.verificationCode?.type === "validate" && (
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-verification-code"
                defaultMessage="The verification code is invalid"
              ></FormattedMessage>
            </FormErrorMessage>
          )}
          {errors.verificationCode?.type === "required" && (
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.required-verification-code"
                defaultMessage="The verification code is required"
              ></FormattedMessage>
            </FormErrorMessage>
          )}
        </FormControl>
        <FormControl isInvalid={!!errors.password1}>
          <FormLabel htmlFor="password">
            <FormattedMessage
              id="generic.forms.new-password-label"
              defaultMessage="New password"
            ></FormattedMessage>
          </FormLabel>
          <PasswordInput
            id="password"
            name="password1"
            ref={register({
              required: true,
              validate: value => value.length >= 8
            })}
          />
          {errors.password1 && (
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.password-policy-error"
                defaultMessage="The password must have a least 8 characters"
              ></FormattedMessage>
            </FormErrorMessage>
          )}
        </FormControl>
        <FormControl mt={2} isInvalid={!!errors.password2}>
          <FormLabel htmlFor="password-confirm">
            <FormattedMessage
              id="generic.forms.confirm-password-label"
              defaultMessage="Confirm password"
            ></FormattedMessage>
          </FormLabel>
          <PasswordInput
            id="password-confirm"
            name="password2"
            ref={register({
              required: true,
              validate: value => value === getValues().password1
            })}
          />
          {errors.password2 && (
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.passwords-must-match"
                defaultMessage="Passwords must match"
              ></FormattedMessage>
            </FormErrorMessage>
          )}
        </FormControl>
        <Button
          mt={6}
          width="100%"
          variantColor="purple"
          isLoading={isSubmitting}
          type="submit"
        >
          <FormattedMessage
            id="public.forgot-password.reset-button"
            defaultMessage="Reset password"
          ></FormattedMessage>
        </Button>
      </form>
      <Box marginTop={4} textAlign="center">
        <NormalLink role="button" onClick={onBackToForgotPassword}>
          <FormattedMessage
            id="public.login.back-to-login-link"
            defaultMessage="Go back to forgot password"
          ></FormattedMessage>
        </NormalLink>
      </Box>
    </>
  );
}

export async function getStaticProps() {
  return {};
}

export function getStaticPaths() {
  return {
    paths: languages.map(({ locale }) => ({ params: { locale } })),
    fallback: false
  };
}

export default Forgot;
