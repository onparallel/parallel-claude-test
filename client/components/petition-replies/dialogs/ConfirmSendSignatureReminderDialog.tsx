import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmSendSignatureReminderDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <FormattedMessage
          id="component.confirm-send-signature-reminder.header"
          defaultMessage="Send reminder"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-send-signature-reminder.body"
          defaultMessage="We will send a reminder to all contacts who still need to sign. Do you want to continue?"
        />
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-send-signature-reminder.confirm"
            defaultMessage="Yes, send"
          />
        </Button>
      }
    />
  );
}
export function useConfirmSendSignatureReminderDialog() {
  return useDialog(ConfirmSendSignatureReminderDialog);
}
