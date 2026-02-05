import { Button, FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

interface UnrestrictPetitionDialogProps {
  onUnrestrictPetition: (password: string) => Promise<boolean>;
}

export function UnrestrictPetitionDialog({
  onUnrestrictPetition,
  ...props
}: DialogProps<UnrestrictPetitionDialogProps>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
  } = useForm<{
    password: string;
  }>({
    mode: "onSubmit",
  });

  const passwordRef = useRef<HTMLInputElement>(null);

  const passwordRegister = useRegisterWithRef(passwordRef, register, "password", {
    required: true,
  });

  return (
    <ConfirmDialog
      initialFocusRef={passwordRef}
      header={
        <FormattedMessage
          id="component.password-restrict-petition.title"
          defaultMessage="Password protection"
        />
      }
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ password }) => {
            if (await onUnrestrictPetition(password)) {
              props.onResolve();
            } else {
              setError("password", { type: "invalid" });
            }
          }),
        },
      }}
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.password-restrict-petition.body"
              defaultMessage="This parallel is protected. Enter the password to unlock it."
            />
          </Text>
          <FormControl id="password" isInvalid={!!errors.password}>
            <FormLabel>
              <FormattedMessage id="generic.forms.password-label" defaultMessage="Password" />
            </FormLabel>
            <PasswordInput {...passwordRegister} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.incorrect-password"
                defaultMessage="The password is incorrect"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePasswordRestrictPetitionDialog() {
  return useDialog(UnrestrictPetitionDialog);
}
