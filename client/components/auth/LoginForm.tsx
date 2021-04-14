import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
} from "@chakra-ui/react";
import { LockIcon } from "@parallel/chakra/icons";
import { Link } from "@parallel/components/common/Link";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { postJSON } from "@parallel/utils/rest";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

export interface LoginData {
  email: string;
  password: string;
}
interface LoginFormProps {
  onSubmit: (data: LoginData) => Promise<void>;
  isSubmitting: boolean;
}
export function LoginForm({ onSubmit, isSubmitting }: LoginFormProps) {
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm<LoginData>();
  const [ssoUrl, setSsoUrl] = useState<string | undefined>(undefined);
  const email = watch("email");
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordRegisterProps = useRegisterWithRef(
    passwordRef,
    register,
    "password",
    { required: true }
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    async function guessLogin() {
      const result = await postJSON<{ type: "SSO" | "PASSWORD"; url?: string }>(
        "/api/auth/guess-login",
        { email }
      );
      if (result?.url && document.activeElement === passwordRef.current) {
        buttonRef.current!.focus();
      }
      setSsoUrl(result?.url);
    }
    if (EMAIL_REGEX.test(email)) {
      guessLogin().then();
    }
  }, [email]);
  return (
    <>
      <Box marginBottom={6} textAlign="center">
        <Heading marginTop={4} marginBottom={2} size="md">
          <FormattedMessage
            id="public.login.header"
            defaultMessage="Enter Parallel"
          />
        </Heading>
        <Text>
          <FormattedMessage
            id="public.login.explanation"
            defaultMessage="Login using your email and password"
          />
        </Text>
      </Box>
      <form
        onSubmit={handleSubmit((data) => {
          if (ssoUrl) {
            window.location.href = ssoUrl;
          } else {
            onSubmit(data);
          }
        })}
        noValidate
      >
        <FormControl id="email" isInvalid={!!errors.email}>
          <FormLabel>
            <FormattedMessage
              id="generic.forms.email-label"
              defaultMessage="Email"
            />
          </FormLabel>
          <Input
            type="email"
            {...register("email", {
              required: true,
              pattern: EMAIL_REGEX,
            })}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.invalid-email-error"
              defaultMessage="Please, enter a valid email"
            />
          </FormErrorMessage>
        </FormControl>
        {ssoUrl ? (
          <Center marginTop={2} height="72px">
            <LockIcon marginRight={2} />
            <FormattedMessage
              id="public.login.sso-enabled"
              defaultMessage="Single sign-on enabled"
            />
          </Center>
        ) : (
          <FormControl
            id="password"
            marginTop={2}
            isInvalid={!!errors.password}
          >
            <FormLabel>
              <FormattedMessage
                id="generic.forms.password-label"
                defaultMessage="Password"
              />
            </FormLabel>
            <PasswordInput {...passwordRegisterProps} />
            {errors.password && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.required-password-error"
                  defaultMessage="Please, enter a password"
                />
              </FormErrorMessage>
            )}
          </FormControl>
        )}
        <Button
          ref={buttonRef}
          marginTop={6}
          width="100%"
          colorScheme="purple"
          isLoading={isSubmitting}
          type="submit"
          id="pw-login-submit"
        >
          {ssoUrl ? (
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          ) : (
            <FormattedMessage id="public.login-button" defaultMessage="Login" />
          )}
        </Button>
      </form>
      <Box marginTop={4} textAlign="center">
        <Link href="/forgot">
          <FormattedMessage
            id="public.login.forgot-password-link"
            defaultMessage="I forgot my password"
          />
        </Link>
      </Box>
    </>
  );
}
