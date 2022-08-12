import { gql } from "@apollo/client";
import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { CreateOrUpdateDocumentThemeDialog_OrganizationThemeFragment } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { Maybe } from "@parallel/utils/types";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";

type DocumentThemeSelection = Omit<
  CreateOrUpdateDocumentThemeDialog_OrganizationThemeFragment,
  "__typename"
>;
type CreateOrUpdateDocumentThemeDialogResult = DocumentThemeSelection;

export function CreateOrUpdateDocumentThemeDialog({
  theme,
  ...props
}: DialogProps<{ theme: Maybe<DocumentThemeSelection> }, CreateOrUpdateDocumentThemeDialogResult>) {
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
            id="component.create-or-update-document-theme-dialog.edit-theme"
            defaultMessage="Edit theme"
          />
        ) : (
          <FormattedMessage
            id="component.create-or-update-document-theme-dialog.new-theme"
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
                id="component.create-or-update-document-theme-dialog.name-error"
                defaultMessage="Please, enter a name for the theme"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl as={HStack}>
            <Checkbox {...register("isDefault")}>
              <FormattedMessage
                id="component.create-or-update-document-theme-dialog.set-default-label"
                defaultMessage="Set as default theme"
              />
            </Checkbox>
            <HelpPopover>
              <FormattedMessage
                id="component.create-or-update-document-theme-dialog.set-default-help"
                defaultMessage="When creating new templates, this theme will be used as default. Existing templates are not affected."
              />
            </HelpPopover>
          </FormControl>
        </Stack>
      }
      alternative={
        isDefined(theme) && !theme.isDefault ? (
          <Button colorScheme="red" onClick={() => props.onReject("DELETE_THEME")}>
            <FormattedMessage
              id="component.create-or-update-document-theme-dialog.delete-theme-button"
              defaultMessage="Delete theme"
            />
          </Button>
        ) : null
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          {isUpdate ? (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          ) : (
            <FormattedMessage
              id="component.create-or-update-document-theme-dialog.create-theme-button"
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
