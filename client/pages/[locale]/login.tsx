import { gql, useApolloClient } from "@apollo/client";
import {
  Avatar,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  useToast,
} from "@chakra-ui/core";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { Title } from "@parallel/components/common/Title";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicUserFormContainer } from "@parallel/components/public/PublicUserContainer";
import {
  Login_UserFragment,
  useCurrentUserQuery,
} from "@parallel/graphql/__types";
import { postJson } from "@parallel/utils/rest";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

function Login() {
  const router = useRouter();
  const client = useApolloClient();
  const { data } = useCurrentUserQuery();
  const [showContinueAs, setShowContinueAs] = useState(Boolean(data?.me));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordChange, setPasswordChange] = useState<{
    required: boolean;
    email?: string;
    password?: string;
  }>({ required: false });
  const intl = useIntl();
  const toast = useToast();

  async function onLoginSubmit({ email, password }: LoginFormData) {
    setIsSubmitting(true);
    try {
      const { token } = await postJson("/api/auth/login", {
        email,
        password,
      });
      await client.clearStore();
      localStorage.setItem("token", token);
      router.push(
        "/[locale]/app/petitions",
        `/${router.query.locale}/app/petitions`
      );
    } catch (error) {
      if (error.error === "NewPasswordRequired") {
        setPasswordChange({ required: true, email, password });
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

  async function onPasswordChangeSubmit({
    password1: newPassword,
  }: PasswordChangeData) {
    setIsSubmitting(true);
    try {
      const { email, password } = passwordChange;
      const { token } = await postJson("/api/auth/new-password", {
        email,
        password,
        newPassword,
      });
      localStorage.setItem("token", token);
      router.push(
        "/[locale]/app/petitions",
        `/${router.query.locale}/app/petitions`
      );
    } catch (error) {}
    setIsSubmitting(false);
  }

  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "public.login.title",
          defaultMessage: "Login",
        })}
      </Title>
      <PublicLayout>
        <PublicUserFormContainer>
          {showContinueAs ? (
            <AlreadyLoggedIn
              me={data!.me}
              onRelogin={() => setShowContinueAs(false)}
              onContinueAs={() =>
                router.push(
                  "/[locale]/app/petitions",
                  `/${router.query.locale}/app/petitions`
                )
              }
            />
          ) : passwordChange.required ? (
            <PasswordChangeForm
              onSubmit={onPasswordChangeSubmit}
              onBackToLogin={() => setPasswordChange({ required: false })}
              isSubmitting={isSubmitting}
            />
          ) : (
            <LoginForm onSubmit={onLoginSubmit} isSubmitting={isSubmitting} />
          )}
        </PublicUserFormContainer>
      </PublicLayout>
    </>
  );
}

interface AlreadyLoggedInProps {
  me: Login_UserFragment;
  onRelogin: () => void;
  onContinueAs: () => void;
}

function AlreadyLoggedIn({
  me,
  onRelogin,
  onContinueAs,
}: AlreadyLoggedInProps) {
  return (
    <>
      <Box marginTop={4} textAlign="center">
        <Avatar name={me.fullName ?? undefined} size="lg"></Avatar>
        <Text marginTop={4}>
          <FormattedMessage
            id="public.login.already-logged-in.explanation"
            defaultMessage="You are already logged in as {name}"
            values={{ name: <b>{me.fullName || me.email}</b> }}
          ></FormattedMessage>
        </Text>
        {me.fullName ? <Text>({me.email})</Text> : null}
      </Box>
      <Button
        mt={6}
        width="100%"
        variantColor="purple"
        type="submit"
        onClick={onContinueAs}
      >
        <FormattedMessage
          id="public.login.already-logged-in.continue-button"
          defaultMessage="Continue as {name}"
          values={{ name: me.fullName || me.email }}
        ></FormattedMessage>
      </Button>
      <Box marginTop={4} textAlign="center">
        <NormalLink role="button" onClick={onRelogin}>
          <FormattedMessage
            id="public.login.already-logged-in.relogin"
            defaultMessage="Login as someone else"
          ></FormattedMessage>
        </NormalLink>
      </Box>
    </>
  );
}

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isSubmitting: boolean;
}

function LoginForm({ onSubmit, isSubmitting }: LoginFormProps) {
  const { handleSubmit, register, errors } = useForm<LoginFormData>();
  return (
    <>
      <Box marginBottom={6} textAlign="center">
        <Heading marginTop={4} marginBottom={2} fontSize="lg">
          <FormattedMessage
            id="public.login.header"
            defaultMessage="Enter Parallel"
          ></FormattedMessage>
        </Heading>
        <Text>
          <FormattedMessage
            id="public.login.explanation"
            defaultMessage="Login using your email and password"
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
              pattern: EMAIL_REGEX,
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
        <FormControl mt={2} isInvalid={!!errors.password}>
          <FormLabel htmlFor="password">
            <FormattedMessage
              id="generic.forms.password-label"
              defaultMessage="Password"
            ></FormattedMessage>
          </FormLabel>
          <PasswordInput
            id="password"
            name="password"
            ref={register({ required: true })}
          />
          {errors.password && (
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.required-password-error"
                defaultMessage="Please, enter a password"
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
            id="public.login-button"
            defaultMessage="Login"
          ></FormattedMessage>
        </Button>
      </form>
      <Box marginTop={4} textAlign="center">
        <Link href="/forgot">
          <FormattedMessage
            id="public.login.forgot-password-link"
            defaultMessage="I forgot my password"
          ></FormattedMessage>
        </Link>
      </Box>
    </>
  );
}

interface PasswordChangeData {
  password1: string;
  password2: string;
}

interface PasswordChangeFormProps {
  onSubmit: (data: PasswordChangeData) => Promise<void>;
  onBackToLogin: () => void;
  isSubmitting: boolean;
}

function PasswordChangeForm({
  onSubmit,
  onBackToLogin,
  isSubmitting,
}: PasswordChangeFormProps) {
  const { handleSubmit, register, errors, getValues } = useForm<
    PasswordChangeData
  >({ mode: "onBlur" });
  return (
    <>
      <Box marginBottom={6} textAlign="center">
        <Heading marginTop={4} marginBottom={2} fontSize="lg">
          <FormattedMessage
            id="public.login.password-update-header"
            defaultMessage="Update your password"
          ></FormattedMessage>
        </Heading>
        <Text>
          <FormattedMessage
            id="public.login.password-update-explanation"
            defaultMessage="First time users need to update their password"
          ></FormattedMessage>
        </Text>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
              validate: (value) => value.length >= 8,
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
              id="generic.forms.password-label"
              defaultMessage="Password"
            ></FormattedMessage>
          </FormLabel>
          <PasswordInput
            id="password-confirm"
            name="password2"
            ref={register({
              required: true,
              validate: (value) => value === getValues().password1,
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
            id="public.login.password-update-button"
            defaultMessage="Update password"
          ></FormattedMessage>
        </Button>
      </form>
      <Box marginTop={4} textAlign="center">
        <NormalLink role="button" onClick={onBackToLogin}>
          <FormattedMessage
            id="public.login.back-to-login-link"
            defaultMessage="Go back to login"
          ></FormattedMessage>
        </NormalLink>
      </Box>
    </>
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
