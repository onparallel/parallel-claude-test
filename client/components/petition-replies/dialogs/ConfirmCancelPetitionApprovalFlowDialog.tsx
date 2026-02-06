import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

export function ConfirmCancelPetitionApprovalFlowDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <Text>
          <FormattedMessage
            id="component.confirm-cancel-petition-approval-flow-dialog.header"
            defaultMessage="Do you want to cancel this approval?"
          />
        </Text>
      }
      body={
        <Text>
          <FormattedMessage
            id="component.confirm-cancel-petition-approval-flow-dialog.body"
            defaultMessage="If you continue, the initiated approval will be cancelled and we will notify the approvers. You will be able to restart it later."
          />
        </Text>
      }
      confirm={
        <Button colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.yes-cancel" defaultMessage="Yes, cancel" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmCancelPetitionApprovalFlowDialog() {
  return useDialog(ConfirmCancelPetitionApprovalFlowDialog);
}
