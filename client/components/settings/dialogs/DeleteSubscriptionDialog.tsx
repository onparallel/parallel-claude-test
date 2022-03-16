import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmInput } from "@parallel/components/common/ConfirmInput";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

export function DeleteSubscriptionDialog({
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
          id="component.delete-event-subscription-dialog.header"
          defaultMessage="Delete event {count, plural, =1 {subscription} other {subscriptions}}"
          values={{ count: selectedCount }}
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.delete-event-subscription-dialog.body"
              defaultMessage="Are you sure you want to delete the {count, plural, =1 {selected event subscription} other {# selected event subscriptions}}?"
              values={{ count: selectedCount }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.delete-event-subscription-dialog.warning"
              defaultMessage="Any applications or scripts using this event {count, plural, =1 {subscription} other {subscriptions}} will no longer receive event notifications from Parallel."
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

export function useDeleteSubscriptionDialog() {
  return useDialog(DeleteSubscriptionDialog);
}
