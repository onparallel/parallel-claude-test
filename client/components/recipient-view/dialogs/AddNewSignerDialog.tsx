import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { Tone } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { DialogProps, useDialog } from "../../common/dialogs/DialogProvider";

type NewSignerInfo = {
  firstName: string;
  lastName: string;
  email: string;
};
function AddNewSignerDialog({ tone, ...props }: DialogProps<{ tone: Tone }, NewSignerInfo>) {
  const intl = useIntl();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewSignerInfo>({
    shouldFocusError: true,
    mode: "onSubmit",
  });
  const emailRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
  });

  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      initialFocusRef={emailRef}
      content={{
        as: "form",
        onSubmit: handleSubmit<NewSignerInfo>((data) =>
          props.onResolve({
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.toLowerCase(),
          })
        ),
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
              <FormattedMessage
                id="generic.forms.invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
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
                  id="generic.forms.invalid-first-name-error"
                  defaultMessage="Please, enter the first name"
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
                  id="generic.forms.invalid-last-name-error"
                  defaultMessage="Please, enter the last name"
                />
              </FormErrorMessage>
            </FormControl>
          </Stack>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.add" defaultMessage="Add" />
        </Button>
      }
    />
  );
}

export function useAddNewSignerDialog() {
  return useDialog(AddNewSignerDialog);
}
