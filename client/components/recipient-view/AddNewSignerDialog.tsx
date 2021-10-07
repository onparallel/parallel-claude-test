import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { useTone } from "../common/toneContext";

type NewSignerInfo = {
  firstName: string;
  lastName: string;
  email: string;
};
function AddNewSignerDialog({
  emails,
  ...props
}: DialogProps<{ emails: string[] }, NewSignerInfo>) {
  const intl = useIntl();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewSignerInfo>({
    shouldFocusError: true,
    mode: "onSubmit",
  });
  const { tone } = useTone();
  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
    validate: (email: string) => !emails.includes(email),
  });

  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      initialFocusRef={emailRef}
      content={{
        as: "form",
        onSubmit: handleSubmit<NewSignerInfo>(props.onResolve),
      }}
      header={
        <FormattedMessage
          id="components.add-new-signer-dialog.header"
          defaultMessage="Enter the signer's information"
          values={{ tone }}
        />
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>
              <FormattedMessage id="generic.forms.email-label" defaultMessage="Email" />
            </FormLabel>
            <Input
              {...emailRegisterProps}
              placeholder={intl.formatMessage({
                id: "generic.forms.email-placeholder",
                defaultMessage: "name@example.com",
              })}
            />
            <FormErrorMessage>
              {errors.email?.type === "validate" ? (
                <FormattedMessage
                  id="components.add-new-signer-dialog.email-already-used.error"
                  defaultMessage="This email is already on the list of signers"
                />
              ) : (
                <FormattedMessage
                  id="generic.forms.invalid-email-error"
                  defaultMessage="Please, enter a valid email"
                />
              )}
            </FormErrorMessage>
          </FormControl>
          <Stack direction="row">
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel>
                <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
              </FormLabel>
              <Input {...register("firstName", { required: true })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-user-first-name-error"
                  defaultMessage="Please, enter the user first name"
                />
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.lastName}>
              <FormLabel>
                <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
              </FormLabel>
              <Input {...register("lastName", { required: true })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-user-last-name-error"
                  defaultMessage="Please, enter the user last name"
                />
              </FormErrorMessage>
            </FormControl>
          </Stack>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage id="generic.add" defaultMessage="Add" />
        </Button>
      }
    />
  );
}

export function useAddNewSignerDialog() {
  return useDialog(AddNewSignerDialog);
}
