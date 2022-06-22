import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
} from "@chakra-ui/react";
import { Link } from "@parallel/components/common/Link";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

export interface ForgotPasswordData {
  email: string;
}
interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordData) => Promise<void>;
  isSubmitting: boolean;
  isExternalUserError?: boolean;
}
export function ForgotPasswordForm({
  onSubmit,
  isSubmitting,
  isExternalUserError,
}: ForgotPasswordFormProps) {
  const intl = useIntl();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ForgotPasswordData>();
  return (
    <>
      <Box marginBottom={10}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginBottom={4}>
          <FormattedMessage id="public.forgot-password.header" defaultMessage="Forgot password" />
        </Text>
        <Text>
          <FormattedMessage
            id="public.forgot-password.explanation"
            defaultMessage="We will send you a message to reset your password."
          />
        </Text>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormControl id="email" isInvalid={!!errors.email || isExternalUserError}>
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
            {isExternalUserError ? (
              <FormattedMessage
                id="generic.forms.sso-user-error"
                defaultMessage="Your account uses SSO. To reset your password, please contact your team admin."
              />
            ) : errors.email ? (
              <FormattedMessage
                id="generic.forms.invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            ) : null}
          </FormErrorMessage>
        </FormControl>
        <Button
          className="notranslate"
          marginTop={6}
          width="100%"
          colorScheme="primary"
          isLoading={isSubmitting}
          type="submit"
        >
          <FormattedMessage
            id="public.forgot-password.send-button"
            defaultMessage="Send verification code"
          />
        </Button>
      </form>
      <Box marginTop={4} textAlign="center">
        <Link href="/login">
          <FormattedMessage
            id="public.forgot-password.login-link"
            defaultMessage="I remembered my password"
          />
        </Link>
      </Box>
    </>
  );
}
