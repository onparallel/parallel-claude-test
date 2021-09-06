import { useToast } from "@chakra-ui/react";
import {
  ForgotPasswordData,
  ForgotPasswordForm,
} from "@parallel/components/auth/ForgotPasswordForm";
import { PasswordResetData, PasswordResetForm } from "@parallel/components/auth/PasswordResetForm";
import { NormalLink } from "@parallel/components/common/Link";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicUserFormContainer } from "@parallel/components/public/PublicUserContainer";
import languages from "@parallel/lang/languages.json";
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
  }>({ sent: false });
  const router = useRouter();
  const intl = useIntl();
  const toast = useToast();

  async function handleForgotPasswordSubmit({ email }: ForgotPasswordData) {
    setIsSubmitting(true);
    try {
      await postJSON("/api/auth/forgot-password", {
        email,
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
      if (error.error === "ExternalUser") {
        setVerification({
          sent: false,
          isExternalUserError: error.error === "ExternalUser",
        });
      }
    }
    setIsSubmitting(false);
  }

  async function handlePasswordResetSubmit({ verificationCode, password }: PasswordResetData) {
    setIsSubmitting(true);
    setVerification({
      ...verification,
      hasVerificationCodeError: false,
      isInvalidPassword: false,
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
      router.push(`/${router.query.locale}/login`);
    } catch (error: any) {
      setVerification({
        ...verification,
        hasVerificationCodeError: error.error === "InvalidVerificationCode",
        isInvalidPassword: error.error === "InvalidPassword",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.forgot.title",
        defaultMessage: "Forgot password",
      })}
    >
      <PublicUserFormContainer>
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
    </PublicLayout>
  );
}

export async function getStaticProps() {
  return { props: {} };
}

export function getStaticPaths() {
  return {
    paths: languages.map(({ locale }) => ({ params: { locale } })),
    fallback: false,
  };
}

export default Forgot;
