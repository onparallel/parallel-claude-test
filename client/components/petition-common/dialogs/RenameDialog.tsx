import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionBaseOrFolder } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface RenameDialogProps {
  name: string | null | undefined;
  type: PetitionBaseOrFolder["__typename"];
  isDisabled: boolean;
}

function RenameDialog({
  name,
  type,
  isDisabled,
  ...props
}: DialogProps<RenameDialogProps, string>) {
  const {
    handleSubmit,
    register,
    formState: { isDirty, errors },
  } = useForm<{ name: string }>({
    defaultValues: { name: name ?? "" },
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const nameProps = useRegisterWithRef(nameRef, register, "name", {
    maxLength: 255,
    required: true,
    validate: type === "PetitionFolder" ? { noSlash: (value) => !value.includes("/") } : undefined,
  });

  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={nameRef}
      content={
        {
          as: "form",
          onSubmit: handleSubmit(({ name }) => props.onResolve(name)),
        } as any
      }
      {...props}
      header={
        type === "PetitionTemplate" ? (
          <FormattedMessage
            id="component.rename-dialog.header-template"
            defaultMessage="Rename template"
          />
        ) : type === "Petition" ? (
          <FormattedMessage
            id="component.rename-dialog.header-petition"
            defaultMessage="Rename parallel"
          />
        ) : (
          <FormattedMessage
            id="component.rename-dialog.header-petition-folder"
            defaultMessage="Rename folder"
          />
        )
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.name} isDisabled={isDisabled}>
            <FormLabel>
              {type === "PetitionTemplate" ? (
                <FormattedMessage id="generic.template-name" defaultMessage="Template name" />
              ) : type === "Petition" ? (
                <FormattedMessage id="generic.parallel-name" defaultMessage="Parallel name" />
              ) : (
                <FormattedMessage id="generic.folder-name" defaultMessage="Folder name" />
              )}
            </FormLabel>
            <Input {...nameProps} />
            <FormErrorMessage>
              {errors.name?.type === "maxLength" ? (
                <FormattedMessage
                  id="generic.folder-name.max-length-error"
                  defaultMessage="Name cannot exceed {max} characters"
                  values={{ max: 255 }}
                />
              ) : errors.name?.type === "noSlash" ? (
                <FormattedMessage
                  id="generic.folder-name.no-slash-error"
                  defaultMessage="Name can't contain the slash character /"
                />
              ) : errors.name?.type === "required" ? (
                <FormattedMessage
                  id="generic.folder-name.required-error"
                  defaultMessage="Please enter a name"
                />
              ) : null}
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
