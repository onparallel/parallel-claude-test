import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmDeactivateEventSubscriptionDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-deactivate-event-subscription-dialog.header"
          defaultMessage="Deactivate event subscription"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-deactivate-event-subscription-dialog.body"
              defaultMessage="Are you sure you want to deactivate the selected event subscription?"
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.confirm-deactivate-event-subscription-dialog.warning"
              defaultMessage="Any applications or scripts using this event subscription will no longer receive event notifications from Parallel."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-deactivate-event-subscription-dialog.confirm-button"
            defaultMessage="Yes, deactivate"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeactivateEventSubscriptionDialog() {
  return useDialog(ConfirmDeactivateEventSubscriptionDialog);
}
