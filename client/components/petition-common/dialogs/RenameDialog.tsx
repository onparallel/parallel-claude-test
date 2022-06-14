import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface RenameDialogProps {
  name: string | null | undefined;
  isTemplate: boolean;
  isDisabled: boolean;
}

interface RenameDialogData {
  newName: string;
}

function RenameDialog({
  name,
  isTemplate,
  isDisabled,
  ...props
}: DialogProps<RenameDialogProps, RenameDialogData>) {
  const {
    handleSubmit,
    register,
    formState: { isDirty, errors },
  } = useForm<RenameDialogData>({
    defaultValues: { newName: name ?? "" },
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const nameProps = useRegisterWithRef(nameRef, register, "newName", { maxLength: 255 });

  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={nameRef}
      content={
        {
          as: "form",
          onSubmit: handleSubmit(({ newName }) => props.onResolve({ newName })),
        } as any
      }
      {...props}
      header={
        isTemplate ? (
          <FormattedMessage
            id="component.rename-dialog.header-template"
            defaultMessage="Rename template"
          />
        ) : (
          <FormattedMessage
            id="component.rename-dialog.header-petition"
            defaultMessage="Rename petition"
          />
        )
      }
      body={
        <Stack>
          <FormControl id="newName" isInvalid={!!errors.newName} isDisabled={isDisabled}>
            <FormLabel>
              {isTemplate ? (
                <FormattedMessage id="generic.template-name" defaultMessage="Template name" />
              ) : (
                <FormattedMessage id="generic.petition-name" defaultMessage="Petition name" />
              )}
            </FormLabel>
            <Input {...nameProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="component.rename-dialog.change-name-error"
                defaultMessage="Name cannot exceed {max} characters"
                values={{ max: 255 }}
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" isDisabled={!isDirty} type="submit">
          <FormattedMessage id="component.rename-dialog.change-name" defaultMessage="Change name" />
        </Button>
      }
    />
  );
}

export function useRenameDialog() {
  return useDialog(RenameDialog);
}
