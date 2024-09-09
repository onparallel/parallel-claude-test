import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { Tone } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { DialogProps, useDialog } from "../../common/dialogs/DialogProvider";

interface NewSignerInfo {
  firstName: string;
  lastName: string;
  email: string;
}
function AddNewSignerDialog({
  tone,
  email,
  ...props
}: DialogProps<{ tone: Tone; email?: string }, NewSignerInfo>) {
  const intl = useIntl();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewSignerInfo>({
    defaultValues: {
      email: email ?? "",
    },
    shouldFocusError: true,
    mode: "onSubmit",
  });
  const emailRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const emailRegisterProps = useRegisterWithRef(emailRef, register, "email", {
    required: true,
    pattern: EMAIL_REGEX,
  });
  const firstNameRegisterProps = useRegisterWithRef(firstNameRef, register, "firstName", {
    required: true,
  });

  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      initialFocusRef={isNonNullish(email) ? firstNameRef : emailRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) =>
            props.onResolve({
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              email: data.email.toLowerCase(),
            }),
          ),
        },
      }}
      header={
        <FormattedMessage
          id="component.add-new-signer-dialog.header"
          defaultMessage="Enter the signer's information"
          values={{ tone }}
        />
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel fontWeight={400}>
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

          <FormControl isInvalid={!!errors.firstName}>
            <FormLabel fontWeight={400}>
              <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
            </FormLabel>
            <Input {...firstNameRegisterProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.invalid-first-name-error"
                defaultMessage="Please, enter the first name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.lastName}>
            <FormLabel fontWeight={400}>
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
