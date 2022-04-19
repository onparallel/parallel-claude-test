import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LockClosedIcon } from "@parallel/chakra/icons";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { postJSON } from "@parallel/utils/rest";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import router, { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

export interface LoginData {
  email: string;
  password: string;
}
interface LoginFormProps {
  onSubmit: (data: LoginData) => Promise<void>;
  isSubmitting: boolean;
}
export function LoginForm({ onSubmit, isSubmitting }: LoginFormProps) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm<LoginData>();
  const { locale } = useRouter();
  const [ssoUrl, setSsoUrl] = useState<string | undefined>(undefined);
  const [forcePassword, setForcePassword] = useState(false);
  const email = watch("email");
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordRegisterProps = useRegisterWithRef(passwordRef, register, "password", {
    required: !ssoUrl,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    async function guessLogin() {
      const result = await postJSON<{ type: "SSO" | "PASSWORD"; url?: string }>(
        "/api/auth/guess-login",
        { email, locale, redirect: router.query.redirect }
      );
      if (result?.url && document.activeElement === passwordRef.current) {
        buttonRef.current!.focus();
      }
      setSsoUrl(result?.url);
    }
    if (EMAIL_REGEX.test(email)) {
      guessLogin().then();
    }
  }, [email, locale]);
  return (
    <>
      <Box marginBottom={10}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginBottom={4}>
          <FormattedMessage id="public.login.header" defaultMessage="Enter Parallel" />
        </Text>
        <Text>
          {ssoUrl && !forcePassword ? (
            <FormattedMessage
              id="public.login.explanation-with-sso"
              defaultMessage="Login using Single sign-on"
            />
          ) : null}
        </Text>
      </Box>
      <form
        onSubmit={handleSubmit((data) => {
          if (ssoUrl && !forcePassword) {
            window.location.href = ssoUrl;
          } else {
            onSubmit(data);
          }
        })}
        noValidate
      >
        <FormControl id="email" isInvalid={!!errors.email}>
          <FormLabel>
            <FormattedMessage id="generic.forms.email-label" defaultMessage="Email" />
          </FormLabel>
          <Input
            type="email"
            {...register("email", {
              required: true,
              pattern: EMAIL_REGEX,
            })}
            placeholder={intl.formatMessage({
              id: "generic.forms.company-email-placeholder",
              defaultMessage: "example@company.com",
            })}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.invalid-email-error"
              defaultMessage="Please, enter a valid email"
            />
          </FormErrorMessage>
        </FormControl>
        {ssoUrl && !forcePassword ? (
          <Center marginTop={2} height="72px">
            <LockClosedIcon marginRight={2} />
            <FormattedMessage
              id="public.login.sso-enabled"
              defaultMessage="Single sign-on enabled"
            />
          </Center>
        ) : (
          <FormControl id="password" marginTop={2} isInvalid={!!errors.password}>
            <FormLabel>
              <FormattedMessage id="generic.forms.password-label" defaultMessage="Password" />
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
          className="notranslate"
          marginTop={6}
          width="100%"
          colorScheme="purple"
          isLoading={isSubmitting}
          type="submit"
          id="pw-login-submit"
        >
          {ssoUrl && !forcePassword ? (
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          ) : (
            <FormattedMessage id="public.login-button" defaultMessage="Login" />
          )}
        </Button>
      </form>
      <Flex
        flexDirection="row"
        marginTop={4}
        justifyContent={ssoUrl && forcePassword ? "space-between" : "center"}
      >
        {ssoUrl && !forcePassword ? (
          <Button
            variant="link"
            onClick={() => {
              setForcePassword(true);
              setTimeout(() => passwordRef.current?.focus());
            }}
          >
            <FormattedMessage
              id="public.login.login-with-password"
              defaultMessage="Login with password"
            />
          </Button>
        ) : (
          <Stack spacing={10} textAlign="center">
            <Text>
              <Link href="/forgot">
                <FormattedMessage
                  id="public.login.forgot-password-link"
                  defaultMessage="I forgot my password"
                />
              </Link>
            </Text>
            {ssoUrl && forcePassword ? (
              <Button variant="link" onClick={() => setForcePassword(false)}>
                <FormattedMessage
                  id="public.login.login-with-sso"
                  defaultMessage="Login with SSO"
                />
              </Button>
            ) : null}
            <Text>
              <FormattedMessage
                id="public.login.register-for-free"
                defaultMessage="Don't have an account? <a>Register for free</a>"
                values={{
                  a: (chunks: any) => (
                    <NormalLink role="a" href="signup">
                      {chunks}
                    </NormalLink>
                  ),
                }}
              />
            </Text>
          </Stack>
        )}
      </Flex>
    </>
  );
}
