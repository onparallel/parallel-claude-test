import { gql, useApolloClient } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { NormalLink } from "@parallel/components/common/Link";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { PasswordStrengthIndicator } from "@parallel/components/common/PasswordStrengthIndicator";
import {
  PublicSignupForm_emailIsAvailableQuery,
  PublicSignupForm_emailIsAvailableQueryVariables,
} from "@parallel/graphql/__types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { EMAIL_REGEX, PASSWORD_REGEX } from "@parallel/utils/validation";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type PublicSignupFormData = {
  email: string;
  password: string;
};

type PublicSignupFormProps = {
  onNext: (data: PublicSignupFormData) => void;
};
export function PublicSignupForm({ onNext }: PublicSignupFormProps) {
  const intl = useIntl();

  const { handleSubmit, register, formState, watch } = useForm<PublicSignupFormData>({
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const password = watch("password");

  const { errors } = formState;

  const apollo = useApolloClient();
  const debouncedEmailIsAvailable = useDebouncedAsync(
    async (email: string) => {
      const { data } = await apollo.query<
        PublicSignupForm_emailIsAvailableQuery,
        PublicSignupForm_emailIsAvailableQueryVariables
      >({
        query: gql`
          query PublicSignupForm_emailIsAvailable($email: String!) {
            emailIsAvailable(email: $email)
          }
        `,
        variables: { email },
        fetchPolicy: "no-cache",
      });
      return data.emailIsAvailable;
    },
    300,
    []
  );

  const emailIsAvailable = async (value: string) => {
    try {
      return await debouncedEmailIsAvailable(value);
    } catch (e) {
      // "DEBOUNCED" error means the search was cancelled because user kept typing
      if (e === "DEBOUNCED") {
        return "DEBOUNCED";
      } else {
        throw e;
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(({ email, password }) => {
        onNext({ email, password });
      })}
    >
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
            defaultMessage="Create your free account now and automate your workflow agilely and safely."
          />
        </Text>
        <FormControl id="email" isInvalid={!!errors.email}>
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form.work-email-label"
              defaultMessage="Work email"
            />
          </FormLabel>
          <InputGroup>
            <Input
              {...register("email", {
                required: true,
                pattern: EMAIL_REGEX,
                validate: { emailIsAvailable },
              })}
              autoComplete="email"
              placeholder={intl.formatMessage({
                id: "component.public-signup-form.email-placeholder",
                defaultMessage: "example@company.com",
              })}
            />
          </InputGroup>
          {errors.email?.message !== "DEBOUNCED" ? (
            errors.email?.type === "emailIsAvailable" ? (
              <Text color="red.500" fontSize="sm" marginTop={2}>
                <FormattedMessage
                  id="generic.forms.email-already-registered-error"
                  defaultMessage="This email is already registered"
                />
              </Text>
            ) : (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-email-error"
                  defaultMessage="Please, enter a valid email"
                />
              </FormErrorMessage>
            )
          ) : null}
        </FormControl>
        <FormControl id="password" isInvalid={!!errors.password}>
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form.password-label"
              defaultMessage="Password"
            />
          </FormLabel>
          <PasswordInput
            {...register("password", {
              required: true,
              pattern: PASSWORD_REGEX,
            })}
            autoComplete="new-password"
          />
          <PasswordStrengthIndicator password={password} />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.valid-password-error"
              defaultMessage="Please, enter a valid password"
            />
          </FormErrorMessage>
        </FormControl>

        <Box>
          <Button
            width="100%"
            colorScheme="purple"
            size="md"
            fontSize="md"
            marginTop={4}
            type="submit"
          >
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          </Button>
        </Box>
        <Text align="center" fontSize="sm">
          <FormattedMessage
            id="component.public-signup-form.legal-text"
            defaultMessage="By continuing you agree to our <Terms>Terms & Conditions</Terms> and <Policy>Privacy policy</Policy>"
            values={{
              Terms: (chunks: any) => (
                <NormalLink role="a" href="legal/terms" target="_blank">
                  {chunks}
                </NormalLink>
              ),
              Policy: (chunks: any) => (
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
              Link: (chunks: any) => (
                <NormalLink role="a" href="login">
                  {chunks}
                </NormalLink>
              ),
            }}
          />
        </Text>
      </Stack>
    </form>
  );
}
