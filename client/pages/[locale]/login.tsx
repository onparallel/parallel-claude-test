import { gql, useApolloClient } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import { AlreadyLoggedIn } from "@parallel/components/auth/AlreadyLoggedIn";
import { LoginData, LoginForm } from "@parallel/components/auth/LoginForm";
import {
  PasswordChangeData,
  PasswordChangeForm,
} from "@parallel/components/auth/PasswordChangeForm";
import {
  PasswordResetData,
  PasswordResetForm,
} from "@parallel/components/auth/PasswordResetForm";
import { NormalLink } from "@parallel/components/common/Link";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicUserFormContainer } from "@parallel/components/public/PublicUserContainer";
import { useCurrentUserQuery } from "@parallel/graphql/__types";
import { postJSON } from "@parallel/utils/rest";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Login() {
  const router = useRouter();
  const client = useApolloClient();
  const { data } = useCurrentUserQuery();
  const [showContinueAs, setShowContinueAs] = useState(Boolean(data?.me));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordChange, setPasswordChange] = useState<{
    type: "CHANGE" | "RESET";
    email: string;
    password?: string;
  } | null>(null);
  const [verificationCodeStatus, setVerificationCodeStatus] = useState({
    hasVerificationCodeError: false,
    isInvalidPassword: false,
  });
  const intl = useIntl();

  const toast = useToast();

  async function handleLoginSubmit({ email, password }: LoginData) {
    setIsSubmitting(true);
    try {
      await postJSON<{ token: string }>("/api/auth/login", {
        email,
        password,
      });
      await client.clearStore();
      router.push(`/${router.query.locale}/app/petitions`);
    } catch (error) {
      if (error.error === "NewPasswordRequired") {
        setPasswordChange({ type: "CHANGE", email, password });
      } else if (error.error === "PasswordResetRequired") {
        toast({
          title: intl.formatMessage({
            id: "public.forgot-password.reset-required-toast-title",
            defaultMessage: "Password reset",
          }),
          description: intl.formatMessage({
            id: "public.forgot-password.reset-required-toast-description",
            defaultMessage: "A password reset is required.",
          }),
          status: "error",
          isClosable: true,
        });
        await postJSON("/api/auth/forgot-password", {
          email,
        });
        setPasswordChange({ type: "RESET", email });
      } else {
        toast({
          title: intl.formatMessage({
            id: "public.login.invalid-login.title",
            defaultMessage: "Invalid login",
          }),
          description: intl.formatMessage({
            id: "public.login.invalid-login.description",
            defaultMessage: "The email or password are invalid.",
          }),
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
    setIsSubmitting(false);
  }

  async function handlePasswordChangeSubmit({
    password: newPassword,
  }: PasswordChangeData) {
    setIsSubmitting(true);
    try {
      const { email, password } = passwordChange!;
      await postJSON<{ token: string }>("/api/auth/new-password", {
        email,
        password,
        newPassword,
      });
      router.push(`/${router.query.locale}/app/petitions`);
    } catch (error) {}
    setIsSubmitting(false);
  }

  async function handlePasswordResetSubmit({
    verificationCode,
    password,
  }: PasswordResetData) {
    setIsSubmitting(true);
    setVerificationCodeStatus({
      hasVerificationCodeError: false,
      isInvalidPassword: false,
    });
    try {
      await postJSON("/api/auth/confirm-forgot-password", {
        email: passwordChange!.email,
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
      setPasswordChange(null);
      setIsSubmitting(false);
    } catch (error) {
      setVerificationCodeStatus({
        hasVerificationCodeError: error.error === "InvalidVerificationCode",
        isInvalidPassword: error.error === "InvalidPassword",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.login.title",
        defaultMessage: "Login",
      })}
      description={intl.formatMessage({
        id: "public.login.meta-description",
        defaultMessage: "Login to your Parallel account",
      })}
    >
      <PublicUserFormContainer>
        {showContinueAs ? (
          <AlreadyLoggedIn
            me={data!.me}
            onRelogin={() => setShowContinueAs(false)}
            onContinueAs={() =>
              router.push(`/${router.query.locale}/app/petitions`)
            }
          />
        ) : passwordChange?.type === "CHANGE" ? (
          <PasswordChangeForm
            onSubmit={handlePasswordChangeSubmit}
            backLink={
              <NormalLink role="button" onClick={() => setPasswordChange(null)}>
                <FormattedMessage
                  id="public.login.back-to-login-link"
                  defaultMessage="Go back to login"
                />
              </NormalLink>
            }
            isSubmitting={isSubmitting}
          />
        ) : passwordChange?.type === "RESET" ? (
          <PasswordResetForm
            onSubmit={handlePasswordResetSubmit}
            backLink={
              <NormalLink role="button" onClick={() => setPasswordChange(null)}>
                <FormattedMessage
                  id="public.login.back-to-login-link"
                  defaultMessage="Go back to login"
                />
              </NormalLink>
            }
            hasVerificationCodeError={
              verificationCodeStatus.hasVerificationCodeError
            }
            isInvalidPassword={verificationCodeStatus.isInvalidPassword}
            isSubmitting={isSubmitting}
          />
        ) : (
          <LoginForm onSubmit={handleLoginSubmit} isSubmitting={isSubmitting} />
        )}
      </PublicUserFormContainer>
    </PublicLayout>
  );
}

Login.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  try {
    await fetchQuery(
      gql`
        query CurrentUser {
          me {
            ...Login_User
          }
        }
        fragment Login_User on User {
          id
          fullName
          email
        }
      `,
      { ignoreCache: true }
    );
  } catch (error) {
    return {};
  }
};

export default withApolloData(Login);
