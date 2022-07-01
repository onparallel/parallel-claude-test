import { gql } from "@apollo/client";
import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { Maybe } from "@parallel/utils/types";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";

type DocumentTheme = { name: string; isDefault: boolean }; // CreateOrUpdateDocumentThemeDialog_OrganizationThemeFragment
type CreateOrUpdateDocumentThemeDialogResult = Partial<DocumentTheme>;

export function CreateOrUpdateDocumentThemeDialog({
  theme,
  ...props
}: DialogProps<{ theme: Maybe<DocumentTheme> }, CreateOrUpdateDocumentThemeDialogResult>) {
  const isUpdate = isDefined(theme);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CreateOrUpdateDocumentThemeDialogResult>({
    mode: "onChange",
    defaultValues: {
      isDefault: theme?.isDefault ?? false,
      name: theme?.name ?? "",
    },
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const nameRegisterProps = useRegisterWithRef(nameRef, register, "name", {
    required: true,
    maxLength: 50,
    minLength: 0,
  });

  return (
    <ConfirmDialog
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      initialFocusRef={nameRef}
      header={
        isUpdate ? (
          <FormattedMessage
            id="components.create-or-update-document-theme-dialog.edit-theme"
            defaultMessage="Edit theme"
          />
        ) : (
          <FormattedMessage
            id="components.create-or-update-document-theme-dialog.new-theme"
            defaultMessage="New theme"
          />
        )
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage id="generic.forms.name-label" defaultMessage="Name" />
            </FormLabel>
            <Input {...nameRegisterProps} maxLength={50} />
            <FormErrorMessage>
              <FormattedMessage
                id="components.create-or-update-document-theme-dialog.name-error"
                defaultMessage="Please, enter a name for the theme"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl>
            <Checkbox {...register("isDefault")}>
              <FormattedMessage
                id="components.create-or-update-document-theme-dialog.set-default-label"
                defaultMessage="Set as Default theme"
              />
            </Checkbox>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          {isUpdate ? (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          ) : (
            <FormattedMessage
              id="components.create-or-update-document-theme-dialog.create-theme-button"
              defaultMessage="Create theme"
            />
          )}
        </Button>
      }
      {...props}
    />
  );
}

CreateOrUpdateDocumentThemeDialog.fragments = {
  OrganizationTheme: gql`
    fragment CreateOrUpdateDocumentThemeDialog_OrganizationTheme on OrganizationTheme {
      name
      isDefault
    }
  `,
};

export function useCreateOrUpdateDocumentThemeDialog() {
  return useDialog(CreateOrUpdateDocumentThemeDialog);
}
