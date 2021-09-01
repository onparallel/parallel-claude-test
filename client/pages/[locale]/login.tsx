import { gql, useApolloClient } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  CloseButton,
  Flex,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { AlreadyLoggedIn } from "@parallel/components/auth/AlreadyLoggedIn";
import { LoginData, LoginForm } from "@parallel/components/auth/LoginForm";
import {
  PasswordChangeData,
  PasswordChangeForm,
} from "@parallel/components/auth/PasswordChangeForm";
import { PasswordResetData, PasswordResetForm } from "@parallel/components/auth/PasswordResetForm";
import { NormalLink } from "@parallel/components/common/Link";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicUserFormContainer } from "@parallel/components/public/PublicUserContainer";
import {
  useCurrentUserQuery,
  useLogin_resendVerificationCodeMutation,
} from "@parallel/graphql/__types";
import { postJSON } from "@parallel/utils/rest";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Login() {
  const router = useRouter();
  const client = useApolloClient();
  const { data } = useCurrentUserQuery();
  const [showContinueAs, setShowContinueAs] = useState(Boolean(data?.me));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [activationLinkSent, setActivationLinkSent] = useState(false);
  const inactiveEmail = useRef("");
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
      window.location.href = `/${router.query.locale}/app/petitions`;
    } catch (error: any) {
      if (error.error === "NewPasswordRequired") {
        setPasswordChange({ type: "CHANGE", email, password });
      } else if (error.error === "UserNotConfirmedException") {
        inactiveEmail.current = email;
        setShowAlert(true);
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
      router.push(`/${router.query.locale}/app/petitions`);
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

  const resendErrorToast = () => {
    toast({
      title: intl.formatMessage({
        id: "generic.something-went-wrong",
        defaultMessage: "Something went wrong",
      }),
      description: intl.formatMessage({
        id: "generic.please-try-again-later",
        defaultMessage: "Please try again later",
      }),
      status: "error",
      isClosable: true,
    });
  };

  const resendSuccessToast = () => {
    toast({
      title: intl.formatMessage({
        id: "public.resend-activation-email.success-title",
        defaultMessage: "Activation link sent",
      }),
      description: intl.formatMessage({
        id: "public.resend-activation-email.success-description",
        defaultMessage: "Please, check your email.",
      }),
      status: "success",
      isClosable: true,
    });
  };

  const [resendVerificationCode] = useLogin_resendVerificationCodeMutation();
  const debouncedResendVerificationCode = useDebouncedAsync(
    async () => {
      if (activationLinkSent) {
        resendSuccessToast();
        return;
      }
      try {
        const { data } = await resendVerificationCode({
          variables: {
            email: inactiveEmail.current,
            locale: intl.locale,
          },
        });
        if (data?.resendVerificationCode === "SUCCESS") {
          resendSuccessToast();
          setActivationLinkSent(true);
        } else {
          resendErrorToast();
        }
      } catch (error) {
        resendErrorToast();
      }
    },
    300,
    [inactiveEmail.current, activationLinkSent]
  );

  const handleResendActivationEmail = async () => {
    try {
      return await debouncedResendVerificationCode();
    } catch (e) {
      // "DEBOUNCED" error means the search was cancelled because user kept trying
      if (e === "DEBOUNCED") {
        return "DEBOUNCED";
      } else {
        throw e;
      }
    }
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
    >
      {showAlert ? (
        <Alert status="error" variant="subtle" zIndex={2}>
          <Flex
            maxWidth="container.lg"
            alignItems="center"
            justifyContent="flex-start"
            marginX="auto"
            width="100%"
            paddingLeft={4}
            paddingRight={12}
          >
            <AlertIcon />
            <Stack spacing={1}>
              <AlertTitle>
                <FormattedMessage
                  id="public.login.activation-pending-title"
                  defaultMessage="Activation pending"
                />
              </AlertTitle>
              <AlertDescription>
                <Text>
                  <FormattedMessage
                    id="public.login.activation-pending-body"
                    defaultMessage="Please activate your account through the activation link that was sent to your email."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="public.login.activation-pending-resend"
                    defaultMessage="Can't find it? <a>Resend email.</a>"
                    values={{
                      a: (chunks: any) => (
                        <strong>
                          <Text as="a" cursor="pointer" onClick={handleResendActivationEmail}>
                            {chunks}
                          </Text>
                        </strong>
                      ),
                    }}
                  />
                </Text>
              </AlertDescription>
            </Stack>
          </Flex>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setShowAlert(false)}
          />
        </Alert>
      ) : null}

      <PublicUserFormContainer>
        {showContinueAs ? (
          <AlreadyLoggedIn
            me={data!.me}
            onRelogin={() => setShowContinueAs(false)}
            onContinueAs={() => router.push(`/${router.query.locale}/app/petitions`)}
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
  } catch (error: any) {
    return {};
  }
};

export default withApolloData(Login);
