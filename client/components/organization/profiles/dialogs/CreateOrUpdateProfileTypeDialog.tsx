import { Button, FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

interface CreateOrUpdateProfileTypeDialogProps {
  name?: LocalizableUserText;
  isEditing?: boolean;
}

interface CreateOrUpdateProfileTypeDialogResult {
  name: LocalizableUserText;
}

function CreateOrUpdateProfileTypeDialog({
  name,
  isEditing,
  ...props
}: DialogProps<CreateOrUpdateProfileTypeDialogProps, CreateOrUpdateProfileTypeDialogResult>) {
  const intl = useIntl();

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<CreateOrUpdateProfileTypeDialogResult>({
    defaultValues: {
      name: name ?? {
        [intl.locale]: "",
      },
    },
  });
  const focusRef = useRef<HTMLInputElement>(null);

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      initialFocusRef={focusRef}
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ name }) => {
          props.onResolve({ name });
        }),
      }}
      header={
        isDefined(name) && isEditing ? (
          <FormattedMessage
            id="component.create-profile-type-dialog.edit-profile-type-name"
            defaultMessage="Edit profile type name"
          />
        ) : (
          <FormattedMessage
            id="component.create-profile-type-dialog.new-profile-type"
            defaultMessage="New profile type"
          />
        )
      }
      body={
        <FormControl isInvalid={!!errors.name}>
          <FormLabel fontWeight={400}>
            <FormattedMessage
              id="component.create-profile-type-dialog.name"
              defaultMessage="Name"
            />
          </FormLabel>
          <Controller
            name="name"
            control={control}
            rules={{
              required: true,
              validate: {
                isNotEmpty: (name) => Object.values(name).some((value) => value!.trim().length > 0),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <LocalizableUserTextInput value={value} onChange={onChange} inputRef={focusRef} />
            )}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.field-required-error"
              defaultMessage="This field is required"
            />
          </FormErrorMessage>
        </FormControl>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

export function useCreateOrUpdateProfileTypeDialog() {
  return useDialog(CreateOrUpdateProfileTypeDialog);
}
