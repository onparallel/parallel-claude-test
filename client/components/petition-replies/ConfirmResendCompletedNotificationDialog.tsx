import { Button, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";

import { PlaceholderInputRef } from "../common/PlaceholderInput";

export function ConfirmResendCompletedNotificationDialog(props: DialogProps) {
  const inputRef = useRef<PlaceholderInputRef>(null);

  return (
    <ConfirmDialog
      initialFocusRef={inputRef as any}
      header={
        <FormattedMessage
          id="component.confirm-resend-completed-notification.header"
          defaultMessage="Notification already sent"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.confirm-resend-completed-notification.description"
            defaultMessage="We already sent a confirmation email to the petition contacts. Do you want to send it again?"
          />
        </Text>
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
