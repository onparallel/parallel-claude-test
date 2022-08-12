import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { isNotEmptyText } from "@parallel/utils/strings";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface CreateFolderDialogProps {
  isTemplate: boolean;
}

interface CreateFolderDialogData {
  name: string;
  ids: string[];
}

function CreateFolderDialog({
  isTemplate,
  ...props
}: DialogProps<CreateFolderDialogProps, CreateFolderDialogData>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CreateFolderDialogData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      ids: [],
    },
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const nameRegisterProps = useRegisterWithRef(nameRef, register, "name", {
    required: true,
    validate: { isNotEmptyText },
  });

  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={nameRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          return props.onResolve(data);
        }),
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.create-folder-dialog.create-folder"
          defaultMessage="Create folder"
        />
      }
      body={
        <Stack>
          <FormControl id="folder-name" isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage id="generic.forms.folder-name-label" defaultMessage="Folder name" />
            </FormLabel>
            <Input {...nameRegisterProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-folder-name-error"
                defaultMessage="Please, enter the folder name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="last-name" isInvalid={!!errors.ids}>
            <FormLabel>
              {isTemplate ? (
                <FormattedMessage id="generic.root-templates" defaultMessage="Templates" />
              ) : (
                <FormattedMessage id="generic.root-petitions" defaultMessage="Parallels" />
              )}
            </FormLabel>
            <Input {...register("ids", { required: true })} />
            <FormErrorMessage>
              <FormattedMessage id="generic.required-field" defaultMessage="Required field" />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" isDisabled={false} type="submit">
          <FormattedMessage
            id="component.create-folder-dialog.create-folder"
            defaultMessage="Create folder"
          />
        </Button>
      }
    />
  );
}

export function useCreateFolderDialog() {
  return useDialog(CreateFolderDialog);
}
