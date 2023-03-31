import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { isNotEmptyText } from "@parallel/utils/strings";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface CreateProfileDialogResult {
  typeId: string;
  name: string;
}

function CreateProfileDialog({ ...props }: DialogProps<{}, CreateProfileDialogResult>) {
  const {
    control,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<{ typeId: string | null; name: string }>({
    defaultValues: {
      typeId: null,
      name: "",
    },
  });

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ name, typeId }) => {
          props.onResolve({ name, typeId: typeId! });
        }),
      }}
      header={
        <FormattedMessage
          id="component.create-profile-dialog.new-profile"
          defaultMessage="New profile"
        />
      }
      body={
        <Stack spacing={4}>
          <FormControl isInvalid={!!errors.typeId}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-profile-dialog.profile-type"
                defaultMessage="Profile type"
              />
            </FormLabel>
            <Controller
              name="typeId"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <SimpleSelect
                  value={value}
                  onChange={(profile) => {
                    onChange("someId");
                  }}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-profile-dialog.profile-name"
                defaultMessage="Profile name"
              />
            </FormLabel>
            <Input {...register("name", { required: true, validate: { isNotEmptyText } })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

export function useCreateProfileDialog() {
  return useDialog(CreateProfileDialog);
}
