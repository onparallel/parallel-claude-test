import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { Box, Center, Flex, Image, useToast } from "@chakra-ui/react";
import { AlreadyLoggedIn } from "@parallel/components/auth/AlreadyLoggedIn";
import { EmailVerificationRequiredAlert } from "@parallel/components/auth/EmailVerificationRequiredAlert";
import { LoginData, LoginForm } from "@parallel/components/auth/LoginForm";
import {
  PasswordChangeData,
  PasswordChangeForm,
} from "@parallel/components/auth/PasswordChangeForm";
import { PasswordResetData, PasswordResetForm } from "@parallel/components/auth/PasswordResetForm";
import { NakedLink, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicUserFormContainer } from "@parallel/components/public/PublicUserContainer";
import { PublicSignupRightHeading } from "@parallel/components/public/signup/PublicSignupRightHeading";
import {
  Login_currentUserDocument,
  Login_resendVerificationCodeDocument,
} from "@parallel/graphql/__types";
import { postJSON } from "@parallel/utils/rest";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Login() {
  const router = useRouter();
  const client = useApolloClient();
  const { data } = useQuery(Login_currentUserDocument);
  const [showContinueAs, setShowContinueAs] = useState(Boolean(data?.me));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerificationRequired, setIsVerificationRequired] = useState(false);
  const nonVerifiedEmail = useRef("");
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

  function redirectToApp(locale?: string) {
    router.push(
      typeof router.query.redirect === "string" && router.query.redirect.startsWith("/")
        ? router.query.redirect
        : "/app",
      undefined,
      { locale }
    );
  }

  async function handleLoginSubmit({ email, password }: LoginData) {
    setIsSubmitting(true);
    try {
      const data = await postJSON<{ preferredLocale?: string }>("/api/auth/login", {
        email,
        password,
      });
      await client.clearStore();
      redirectToApp(data?.preferredLocale);
    } catch (error: any) {
      if (error.error === "NewPasswordRequired") {
        setPasswordChange({ type: "CHANGE", email, password });
      } else if (error.error === "UserNotConfirmedException") {
        nonVerifiedEmail.current = email;
        setIsVerificationRequired(true);
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
          locale: intl.locale,
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

  async function handlePasswordChangeSubmit({ password: newPassword }: PasswordChangeData) {
    setIsSubmitting(true);
    try {
      const { email, password } = passwordChange!;
      await postJSON<{ token: string }>("/api/auth/new-password", {
        email,
        password,
        newPassword,
      });
      router.push("/app");
    } catch (error: any) {}
    setIsSubmitting(false);
  }

  async function handlePasswordResetSubmit({ verificationCode, password }: PasswordResetData) {
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
    } catch (error: any) {
      setVerificationCodeStatus({
        hasVerificationCodeError: error.error === "InvalidVerificationCode",
        isInvalidPassword: error.error === "InvalidPassword",
      });
      setIsSubmitting(false);
    }
  }

  const [resendVerificationCode] = useMutation(Login_resendVerificationCodeDocument);
  const handleResendVerificationEmail = async () => {
    try {
      const { data } = await resendVerificationCode({
        variables: {
          email: nonVerifiedEmail.current,
          locale: intl.locale,
        },
      });
      return data?.resendVerificationCode === "SUCCESS";
    } catch (error) {}
    return false;
  };

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
                isOpen={isVerificationRequired}
                onClose={() => setIsVerificationRequired(false)}
                onResendEmail={handleResendVerificationEmail}
              />
              {showContinueAs ? (
                <AlreadyLoggedIn
                  me={data!.me}
                  onRelogin={() => setShowContinueAs(false)}
                  onContinueAs={() => redirectToApp(data!.me.preferredLocale ?? undefined)}
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
                  hasVerificationCodeError={verificationCodeStatus.hasVerificationCodeError}
                  isInvalidPassword={verificationCodeStatus.isInvalidPassword}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <LoginForm onSubmit={handleLoginSubmit} isSubmitting={isSubmitting} />
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

Login.mutations = [
  gql`
    mutation Login_resendVerificationCode($email: String!, $locale: String) {
      resendVerificationCode(email: $email, locale: $locale)
    }
  `,
];

Login.queries = [
  gql`
    query Login_currentUser {
      me {
        id
        preferredLocale
        ...AlreadyLoggedIn_User
      }
    }
    ${AlreadyLoggedIn.fragments.User}
  `,
];

Login.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  try {
    await fetchQuery(Login_currentUserDocument, { ignoreCache: true });
  } catch (error: any) {
    return {};
  }
};

export default withApolloData(Login);
