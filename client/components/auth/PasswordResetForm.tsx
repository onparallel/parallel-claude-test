import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Text,
} from "@chakra-ui/react";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { PASSWORD_REGEX } from "@parallel/utils/validation";
import { ReactElement, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { PasswordStrengthIndicator } from "../common/PasswordStrengthIndicator";
import { PinInput } from "../ui";

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
            id="component.password-reset-form.header"
            defaultMessage="Password reset"
          />
        </Text>
        <Text as="h2" fontSize="xl" fontWeight="bold" marginBottom={2}>
          <FormattedMessage
            id="component.password-reset-form.enter-verification-code"
            defaultMessage="Enter the verification code"
          />
        </Text>
        <Text>
          <FormattedMessage
            id="component.password-reset-form.reset-explanation"
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
              rules={{ required: true, minLength: 6 }}
              render={({ field: { onChange, value }, fieldState }) => (
                <PinInput.Root
                  value={value?.split("") ?? []}
                  onValueChange={(e) => onChange(e.value.join(""))}
                  autoFocus
                  isInvalid={fieldState.invalid}
                >
                  {/* TODO: Add control when upgrading to v3 */}
                  <PinInput.Input index={0} />
                  <PinInput.Input index={1} />
                  <PinInput.Input index={2} />
                  <PinInput.Input index={3} />
                  <PinInput.Input index={4} />
                  <PinInput.Input index={5} />
                </PinInput.Root>
              )}
            />
          </Center>
          <FormErrorMessage>
            {errors.verificationCode?.type === "validate" && (
              <FormattedMessage
                id="generic.forms-invalid-verification-code"
                defaultMessage="The verification code is invalid"
              />
            )}
            {(errors.verificationCode?.type === "required" ||
              errors.verificationCode?.type === "minLength") && (
              <FormattedMessage
                id="generic.forms-required-verification-code"
                defaultMessage="The verification code is required"
              />
            )}
          </FormErrorMessage>
        </FormControl>
        <Text as="h2" fontSize="xl" fontWeight="bold" marginBottom={4}>
          <FormattedMessage
            id="component.password-reset-form.change-your-password"
            defaultMessage="Change your password"
          />
        </Text>
        <FormControl id="password" isInvalid={!!errors.password || isInvalidPassword}>
          <FormLabel>
            <FormattedMessage id="generic.new-password-label" defaultMessage="New password" />
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
                id="generic.password-length-error"
                defaultMessage="The password must have a least 8 characters"
              />
            )}
            {isInvalidPassword ? (
              <FormattedMessage
                id="generic.invalid-password-policy-error"
                defaultMessage="Please choose a stronger password"
              />
            ) : null}
          </FormErrorMessage>
        </FormControl>
        <FormControl id="password-confirm" marginTop={2} isInvalid={!!errors.passwordConfirm}>
          <FormLabel>
            <FormattedMessage
              id="generic.confirm-password-label"
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
              id="generic.passwords-must-match-error"
              defaultMessage="Passwords must match"
            />
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
            id="component.password-reset-form.reset-password-button"
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
