import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmSendReminderDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-send-reminder-message.header"
          defaultMessage="Send reminders"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-send-reminder-message.body"
          defaultMessage="Are you sure you want to send a reminder to the selected contacts?"
        />
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-send-reminder-message.confirm"
            defaultMessage="Yes, send"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmSendReminderDialog() {
  return useDialog(ConfirmSendReminderDialog);
}
