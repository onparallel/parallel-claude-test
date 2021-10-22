import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  PinInput,
  PinInputField,
  Text,
} from "@chakra-ui/react";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { PASSWORD_REGEX } from "@parallel/utils/validation";
import { ReactElement, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { PasswordStrengthIndicator } from "../common/PasswordStrengthIndicator";

export interface PasswordResetData {
  verificationCode: string;
  password: string;
  passwordConfirm: string;
}

export interface PasswordResetFormProps {
  onSubmit: (data: PasswordResetData) => Promise<void>;
  backLink?: ReactElement;
  hasVerificationCodeError?: boolean;
  isInvalidPassword?: boolean;
  isSubmitting: boolean;
}

export function PasswordResetForm({
  onSubmit,
  backLink,
  hasVerificationCodeError,
  isInvalidPassword,
  isSubmitting,
}: PasswordResetFormProps) {
  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setError,
    control,
    watch,
    clearErrors,
  } = useForm<PasswordResetData>({ mode: "onBlur" });

  const password = watch("password");

  useEffect(() => {
    if (hasVerificationCodeError) {
      setError("verificationCode", { type: "validate" });
    } else {
      clearErrors("verificationCode");
    }
  }, [hasVerificationCodeError]);

  return (
    <>
      <Box marginBottom={6}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginBottom={8}>
          <FormattedMessage
            id="public.forgot-password.reset-header"
            defaultMessage="Password reset"
          />
        </Text>
        <Text as="h2" fontSize="xl" fontWeight="bold" marginBottom={2}>
          <FormattedMessage
            id="public.forgot-password.enter-verification-code"
            defaultMessage="Enter the verification code"
          />
        </Text>
        <Text>
          <FormattedMessage
            id="public.forgot-password.reset-explanation"
            defaultMessage="Use the verification code in the email you have received."
          />
        </Text>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormControl id="verification-code" isInvalid={!!errors.verificationCode}>
          <Center marginBottom={6} gridGap={3}>
            <Controller
              name="verificationCode"
              control={control}
              render={({ field: { onChange, value } }) => (
                <PinInput onChange={onChange} value={value} autoFocus>
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
              )}
            />
          </Center>
          <FormErrorMessage>
            {errors.verificationCode?.type === "validate" && (
              <FormattedMessage
                id="generic.forms.invalid-verification-code"
                defaultMessage="The verification code is invalid"
              />
            )}
            {errors.verificationCode?.type === "required" && (
              <FormattedMessage
                id="generic.forms.required-verification-code"
                defaultMessage="The verification code is required"
              />
            )}
          </FormErrorMessage>
        </FormControl>
        <Text as="h2" fontSize="xl" fontWeight="bold" marginBottom={4}>
          <FormattedMessage
            id="public.forgot-password.change-your-password"
            defaultMessage="Change your password"
          />
        </Text>
        <FormControl id="password" isInvalid={!!errors.password || isInvalidPassword}>
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
            {errors.password && (
              <FormattedMessage
                id="generic.forms.password-policy-error"
                defaultMessage="The password must have a least 8 characters"
              />
            )}
            {isInvalidPassword ? (
              <FormattedMessage
                id="generic.forms.invalid-password-policy-error"
                defaultMessage="Please choose a stronger password"
              />
            ) : null}
          </FormErrorMessage>
        </FormControl>
        <FormControl id="password-confirm" marginTop={2} isInvalid={!!errors.passwordConfirm}>
          <FormLabel>
            <FormattedMessage
              id="generic.forms.confirm-password-label"
              defaultMessage="Confirm password"
            />
          </FormLabel>
          <PasswordInput
            {...register("passwordConfirm", {
              required: true,
              validate: (value) => value === getValues().password,
            })}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.passwords-must-match"
              defaultMessage="Passwords must match"
            />
          </FormErrorMessage>
        </FormControl>
        <Button
          marginTop={6}
          width="100%"
          colorScheme="purple"
          isLoading={isSubmitting}
          type="submit"
        >
          <FormattedMessage
            id="public.forgot-password.reset-button"
            defaultMessage="Reset password"
          />
        </Button>
      </form>
      <Box marginTop={4} textAlign="center">
        {backLink}
      </Box>
    </>
  );
}
