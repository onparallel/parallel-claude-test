import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { ReactNode, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../common/dialogs/DialogProvider";

export function AskViewNameDialog({
  name,
  header,
  confirm,
  ...props
}: DialogProps<{ name?: string; header: ReactNode; confirm: ReactNode }, string>) {
  const {
    handleSubmit,
    register,
    formState: { errors, isValid },
  } = useForm({ defaultValues: { name: name ?? "" } });

  const nameRef = useRef<HTMLInputElement>(null);
  const nameProps = useRegisterWithRef(nameRef, register, "name", {
    maxLength: 40,
    required: true,
  });

  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={nameRef}
      content={{ as: "form", onSubmit: handleSubmit(({ name }) => props.onResolve(name)) }}
      {...props}
      header={header}
      body={
        <Stack>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel fontWeight="normal">
              <FormattedMessage
                id="component.ask-view-name-dialog.name-label"
                defaultMessage="Enter a meaningful name for the view"
              />
            </FormLabel>
            <Input {...nameProps} />
            <FormErrorMessage>
              {errors.name?.type === "maxLength" ? (
                <FormattedMessage
                  id="component.ask-view-name-dialog.max-length-error"
                  defaultMessage="Name cannot exceed {max} characters"
                  values={{ max: 40 }}
                />
              ) : null}
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" isDisabled={!isValid} type="submit">
          {confirm}
        </Button>
      }
    />
  );
}

export function useAskViewNameDialog() {
  return useDialog(AskViewNameDialog);
}
