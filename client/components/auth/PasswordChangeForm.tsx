import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Text,
} from "@chakra-ui/react";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { PASSWORD_REGEX } from "@parallel/utils/validation";
import { ReactElement } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { PasswordStrengthIndicator } from "../common/PasswordStrengthIndicator";

export interface PasswordChangeData {
  password: string;
}
interface PasswordChangeFormProps {
  onSubmit: (data: PasswordChangeData) => Promise<void>;
  backLink: ReactElement;
  isSubmitting: boolean;
}
export function PasswordChangeForm({ onSubmit, backLink, isSubmitting }: PasswordChangeFormProps) {
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<PasswordChangeData>({
    mode: "onBlur",
  });

  const password = watch("password");
  return (
    <>
      <Box marginBottom={6} textAlign="center">
        <Heading marginTop={4} marginBottom={2} size="md">
          <FormattedMessage
            id="public.login.password-update-header"
            defaultMessage="Update your password"
          />
        </Heading>
        <Text>
          <FormattedMessage
            id="public.login.password-update-explanation"
            defaultMessage="First time users need to update their password"
          />
        </Text>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormControl id="password" isInvalid={!!errors.password}>
          <FormLabel>
            <FormattedMessage id="generic.forms.new-password-label" defaultMessage="New password" />
          </FormLabel>
          <PasswordInput
            {...register("password", {
              required: true,
              pattern: PASSWORD_REGEX,
            })}
          />
          <PasswordStrengthIndicator password={password} />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.password-policy-error"
              defaultMessage="The password must have a least 8 characters"
            />
          </FormErrorMessage>
        </FormControl>
        <Button
          className="notranslate"
          marginTop={6}
          width="100%"
          colorScheme="purple"
          isLoading={isSubmitting}
          type="submit"
        >
          <FormattedMessage
            id="public.login.password-update-button"
            defaultMessage="Update password"
          />
        </Button>
      </form>
      <Box marginTop={4} textAlign="center">
        {backLink}
      </Box>
    </>
  );
}
