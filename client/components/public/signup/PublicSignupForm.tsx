import { Box, Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { NormalLink } from "@parallel/components/common/Link";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { FormattedMessage } from "react-intl";

export type PublicSignupFormProps = {
  onNext: () => void;
};
export function PublicSignupForm({ onNext }: PublicSignupFormProps) {
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
            required
          />
        </FormControl>
        <FormControl id="password">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form.password-label"
              defaultMessage="Password"
            />
          </FormLabel>
          <PasswordInput />
        </FormControl>

        <Box>
          <Button
            type="submit"
            width="100%"
            colorScheme="purple"
            size="md"
            fontSize="md"
            marginTop={4}
            onClick={onNext}
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
            defaultMessage="By signing up you agree to our <Terms>Login</Terms> and <Policy>Privacy policy</Policy>"
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
        <Text align="center">
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
