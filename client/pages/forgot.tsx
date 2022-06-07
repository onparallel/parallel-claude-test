import { gql, useMutation } from "@apollo/client";
import { Box, Center, Flex, Image, useToast } from "@chakra-ui/react";
import { EmailVerificationRequiredAlert } from "@parallel/components/auth/EmailVerificationRequiredAlert";
import {
  ForgotPasswordData,
  ForgotPasswordForm,
} from "@parallel/components/auth/ForgotPasswordForm";
import { PasswordResetData, PasswordResetForm } from "@parallel/components/auth/PasswordResetForm";
import { NakedLink, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicUserFormContainer } from "@parallel/components/public/PublicUserContainer";
import { PublicSignupRightHeading } from "@parallel/components/public/signup/PublicSignupRightHeading";
import {
  Forgot_publicResetTemporaryPasswordDocument,
  Forgot_resendVerificationCodeDocument,
} from "@parallel/graphql/__types";
import { postJSON } from "@parallel/utils/rest";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Forgot() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verification, setVerification] = useState<{
    sent: boolean;
    email?: string;
    hasVerificationCodeError?: boolean;
    isInvalidPassword?: boolean;
    isExternalUserError?: boolean;
    isEmailNotVerifiedError?: boolean;
    isForceChangePasswordError?: boolean;
  }>({ sent: false });
  const router = useRouter();
  const intl = useIntl();
  const toast = useToast();

  async function handleForgotPasswordSubmit({ email }: ForgotPasswordData) {
    setIsSubmitting(true);
    try {
      await postJSON("/api/auth/forgot-password", {
        email,
        locale: intl.locale,
      });
      setVerification({ sent: true, email });
      toast({
        title: intl.formatMessage({
          id: "public.forgot-password.toast-title",
          defaultMessage: "Reset your password",
        }),
        description: intl.formatMessage({
          id: "public.forgot-password.toast-description",
          defaultMessage: "An email is on its way to you with a verification code.",
        }),
        status: "success",
        isClosable: true,
      });
    } catch (error: any) {
      setVerification({
        email,
        sent: false,
        isExternalUserError: error.error === "ExternalUser",
        isEmailNotVerifiedError: error.error === "EmailNotVerifiedException",
        isForceChangePasswordError: error.error === "ForceChangePasswordException",
      });
    }
    setIsSubmitting(false);
  }

  async function handlePasswordResetSubmit({ verificationCode, password }: PasswordResetData) {
    setIsSubmitting(true);
    setVerification({
      ...verification,
      hasVerificationCodeError: false,
      isInvalidPassword: false,
      isEmailNotVerifiedError: false,
      isForceChangePasswordError: false,
    });
    try {
      await postJSON("/api/auth/confirm-forgot-password", {
        email: verification.email,
        verificationCode,
        newPassword: password,
      });
      toast({
        title: intl.formatMessage({
          id: "public.forgot-password.reset-success-toast-title",
          defaultMessage: "Password reset",
        }),
        description: intl.formatMessage({
          id: "public.forgot-password.reset-success-toast-description",
          defaultMessage: "Your password has been reset successfully.",
        }),
        status: "success",
        isClosable: true,
      });
      router.push(`/login`);
    } catch (error: any) {
      setVerification({
        ...verification,
        hasVerificationCodeError: error.error === "InvalidVerificationCode",
        isInvalidPassword: error.error === "InvalidPassword",
      });
    }
    setIsSubmitting(false);
  }

  const [resendVerificationCode] = useMutation(Forgot_resendVerificationCodeDocument);
  const [resetTemporaryPassword] = useMutation(Forgot_publicResetTemporaryPasswordDocument);
  async function handleResendEmail() {
    try {
      if (verification.email) {
        if (verification.isEmailNotVerifiedError) {
          await resendVerificationCode({
            variables: { email: verification.email, locale: intl.locale },
          });
        } else if (verification.isForceChangePasswordError) {
          await resetTemporaryPassword({
            variables: { email: verification.email, locale: intl.locale },
          });
        }
        return true;
      }
    } catch {}
    return false;
  }

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.forgot.title",
        defaultMessage: "Forgot password",
      })}
      hideHeader
      hideFooter
    >
      <Flex minHeight="100vh">
        <Flex direction="column" paddingX={{ base: 6, md: 20 }} flex="1">
          <Box paddingTop={5} marginLeft={-1}>
            <NakedLink href="/">
              <Box as="a">
                <Logo width="152px" />
              </Box>
            </NakedLink>
          </Box>
          <Center
            flex="1"
            maxWidth="md"
            width="100%"
            paddingY={10}
            marginX="auto"
            sx={{
              "@media only screen and (min-width: 62em)": {
                marginX: 0,
              },
              "@media only screen and (min-width: 96em)": {
                margin: "auto",
              },
            }}
          >
            <PublicUserFormContainer>
              <EmailVerificationRequiredAlert
                isOpen={
                  verification.isEmailNotVerifiedError ||
                  verification.isForceChangePasswordError ||
                  false
                }
                onClose={() =>
                  setVerification({
                    sent: false,
                    isEmailNotVerifiedError: false,
                    isForceChangePasswordError: false,
                  })
                }
                onResendEmail={handleResendEmail}
              />
              {verification.sent ? (
                <PasswordResetForm
                  onSubmit={handlePasswordResetSubmit}
                  backLink={
                    <NormalLink role="button" onClick={() => setVerification({ sent: false })}>
                      <FormattedMessage
                        id="public.login.back-to-forgot-link"
                        defaultMessage="Go back to forgot password"
                      />
                    </NormalLink>
                  }
                  isInvalidPassword={verification.isInvalidPassword}
                  hasVerificationCodeError={verification.hasVerificationCodeError}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <ForgotPasswordForm
                  isExternalUserError={verification.isExternalUserError}
                  onSubmit={handleForgotPasswordSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </PublicUserFormContainer>
          </Center>
        </Flex>
        <Box
          display={{ base: "none", lg: "block" }}
          paddingLeft={8}
          maxWidth="container.md"
          flex="1"
        >
          <Flex
            direction="column"
            backgroundImage={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/signup-bg.svg`}
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            height="100%"
            padding={16}
          >
            <PublicSignupRightHeading display="block" />
            <Center height="100%">
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/login/illustration.svg`}
              />
            </Center>
          </Flex>
        </Box>
      </Flex>
    </PublicLayout>
  );
}

Forgot.mutations = [
  gql`
    mutation Forgot_resendVerificationCode($email: String!, $locale: String) {
      resendVerificationCode(email: $email, locale: $locale)
    }
  `,
  gql`
    mutation Forgot_publicResetTemporaryPassword($email: String!, $locale: String) {
      publicResetTemporaryPassword(email: $email, locale: $locale)
    }
  `,
];

export default withApolloData(Forgot);
