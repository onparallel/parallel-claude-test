import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function DeleteSubscriptionDialog({
  selectedCount,
  ...props
}: DialogProps<{ selectedCount: number }>) {
  return (
    <ConfirmDialog
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
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
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
