import { Box, Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { NormalLink } from "@parallel/components/common/Link";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useEffect } from "react";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

export type PublicSignupFormProps = {
  onNext: ({ email, password }: { email: string; password: string }) => void;
};
export function PublicSignupForm({ onNext }: PublicSignupFormProps) {
  const [email, setEmail] = useState("");
  const [isInvalidEmail, setIsInvalidEmail] = useState(false);
  const [password, setPassword] = useState("");
  const [isInvalidPassword, setIsInvalidPassword] = useState(false);

  const handleNext = () => {
    if (!email || !EMAIL_REGEX.test(email)) setIsInvalidEmail(true);
    if (!password) setIsInvalidPassword(true);

    if (email && EMAIL_REGEX.test(email) && password) {
      onNext({ email, password });
    }
  };

  useEffect(() => {
    if (isInvalidEmail && EMAIL_REGEX.test(email)) setIsInvalidEmail(false);
  }, [email]);

  useEffect(() => {
    if (isInvalidPassword) setIsInvalidPassword(false);
  }, [password]);

  return (
    <>
      <Stack spacing={4}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginTop={0}>
          <FormattedMessage
            id="component.public-signup-form.heading"
            defaultMessage="Start to speed up your work"
          />
        </Text>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.public-signup-form.description"
            defaultMessage="Create your free account now and automate your workflow agilely and safety."
          />
        </Text>
        <FormControl id="email">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form.work-email-label"
              defaultMessage="Work email"
            />
          </FormLabel>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="example@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isInvalid={isInvalidEmail}
          />
          {isInvalidEmail && (
            <Text fontSize="sm" color="red.600" paddingTop={1}>
              <FormattedMessage
                id="generic.forms.invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            </Text>
          )}
        </FormControl>
        <FormControl id="password">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form.password-label"
              defaultMessage="Password"
            />
          </FormLabel>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isInvalid={isInvalidPassword}
            autoComplete="current-password"
          />
          {isInvalidPassword && (
            <Text fontSize="sm" color="red.600" paddingTop={1}>
              <FormattedMessage
                id="generic.forms.required-password-error"
                defaultMessage="Please, enter a password"
              />
            </Text>
          )}
        </FormControl>

        <Box>
          <Button
            width="100%"
            colorScheme="purple"
            size="md"
            fontSize="md"
            marginTop={4}
            onClick={handleNext}
          >
            <FormattedMessage
              id="component.public-signup-form.signup-button"
              defaultMessage="Sign up"
            />
          </Button>
        </Box>
        <Text align="center" fontSize="sm">
          <FormattedMessage
            id="component.public-signup-form.legal-text"
            defaultMessage="By signing up you agree to our <Terms>Terms & Conditions</Terms> and <Policy>Privacy policy</Policy>"
            values={{
              Terms: (chunks: any[]) => (
                <NormalLink role="a" href="legal/terms" target="_blank">
                  {chunks}
                </NormalLink>
              ),
              Policy: (chunks: any[]) => (
                <NormalLink role="a" href="legal/privacy" target="_blank">
                  {chunks}
                </NormalLink>
              ),
            }}
          />
        </Text>
        <Text align="center" paddingTop={6}>
          <FormattedMessage
            id="component.public-signup-form.login-text"
            defaultMessage="Already have an account? <Link>Login</Link>"
            values={{
              Link: (chunks: any[]) => (
                <NormalLink role="a" href="login">
                  {chunks}
                </NormalLink>
              ),
            }}
          />
        </Text>
      </Stack>
    </>
  );
}
