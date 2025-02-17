import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmSendReminderPetitionApprovalFlowDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <Text>
          <FormattedMessage
            id="component.confirm-send-reminder-petition-approval-flow-dialog.header"
            defaultMessage="Send reminder"
          />
        </Text>
      }
      body={
        <Text>
          <FormattedMessage
            id="component.confirm-send-reminder-petition-approval-flow-dialog.body"
            defaultMessage="We will send a reminder to all users who have not yet been approved. Do you want to continue?"
          />
        </Text>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-send" defaultMessage="Yes, send" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmSendReminderPetitionApprovalFlowDialog() {
  return useDialog(ConfirmSendReminderPetitionApprovalFlowDialog);
}
