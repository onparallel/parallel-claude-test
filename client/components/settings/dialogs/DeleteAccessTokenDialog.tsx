import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { ConfirmInput } from "../../common/ConfirmInput";

export function DeleteAccessTokenDialog({
  selectedCount,
  ...props
}: DialogProps<{ selectedCount: number }>) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    confirm: boolean;
  }>();
  return (
    <ConfirmDialog
      content={{
        as: "form",
        onSubmit: handleSubmit(() => props.onResolve()),
      }}
      header={
        <FormattedMessage
          id="component.delete-access-token-dialog.header"
          defaultMessage="Revoke access {count, plural, =1 {token} other {tokens}}"
          values={{ count: selectedCount }}
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.delete-access-token-dialog.body"
              defaultMessage="Are you sure you want to delete the {count, plural, =1 {selected access token} other {# selected access tokens}}?"
              values={{ count: selectedCount }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.delete-access-token-dialog.warning"
              defaultMessage="Any applications or scripts using this {count, plural, =1 {token} other {tokens}} will no longer be able to access the Parallel API. This action <b>cannot be undone</b>."
              values={{ count: selectedCount }}
            />
          </Text>
          <Controller
            name="confirm"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <ConfirmInput {...field} isInvalid={!!errors.confirm} />}
          />
        </Stack>
      }
      confirm={
        <Button colorScheme="red" type="submit">
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}

export function useDeleteAccessTokenDialog() {
  return useDialog(DeleteAccessTokenDialog);
}
