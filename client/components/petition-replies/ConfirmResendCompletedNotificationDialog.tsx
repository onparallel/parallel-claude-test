import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmResendCompletedNotificationDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      size="sm"
      header={
        <FormattedMessage
          id="component.confirm-resend-completed-notification.header"
          defaultMessage="Resend confirmation email"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-resend-completed-notification.description"
          defaultMessage="We have already sent a confirmation email to the petition contacts. Would you like to send it again?"
        />
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-resend-completed-notification.confirm-button"
            defaultMessage="Yes, resend the notification"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmResendCompletedNotificationDialog() {
  return useDialog(ConfirmResendCompletedNotificationDialog);
}
