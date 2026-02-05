import { Button, FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { Maybe } from "@parallel/utils/types";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

export interface RestrictPetitionDialogData {
  password: Maybe<string>;
}

export function RestrictPetitionDialog({ ...props }: DialogProps<{}, RestrictPetitionDialogData>) {
  const {
    handleSubmit,
    register,
    getValues,

    formState: { errors },
  } = useForm<{
    password: string;
    passwordConfirm: string;
  }>();

  const passwordRef = useRef<HTMLInputElement>(null);

  const passwordRegister = useRegisterWithRef(passwordRef, register, "password");

  return (
    <ConfirmDialog
      hasCloseButton
      initialFocusRef={passwordRef}
      header={
        <FormattedMessage
          id="component.restrict-petition.title"
          defaultMessage="Restrict editing"
        />
      }
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ password }) => {
            props.onResolve({
              password: password.length > 0 ? password : null,
            });
          }),
        },
      }}
      body={
        <Stack spacing={2}>
          <FormControl id="password" isInvalid={!!errors.password}>
            <FormLabel>
              <FormattedMessage
                id="component.restrict-petition.optional-password-label"
                defaultMessage="Password (Optional)"
              />
            </FormLabel>
            <PasswordInput {...passwordRegister} />
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
          <Text color="gray.600">
            <FormattedMessage
              id="component.restrict-petition.remember-password"
              defaultMessage="Caution: If you lose of forget the password, it cannot be recovered."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      {...props}
    />
  );
}

export function useRestrictPetitionDialog() {
  return useDialog(RestrictPetitionDialog);
}
