import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmCancelOngoingApprovalsDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-disable-ongoing-approvals.header"
          defaultMessage="Ongoing approvals"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-disable-ongoing-approvals-petition-close.body"
          defaultMessage="There is an ongoing approval process. If you close this parallel now, the process will be cancelled."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-disable-ongoing-approvals-petition-close.confirm"
            defaultMessage="Cancel approvals and continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmCancelOngoingApprovalsDialog() {
  return useDialog(ConfirmCancelOngoingApprovalsDialog);
}
