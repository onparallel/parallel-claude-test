import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Box, Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

function ConfirmCancelPetitionApprovalDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-cancel-petition-approval-dialog.header"
          defaultMessage="Cancel approvals"
        />
      }
      body={
        <Box>
          <Text>
            <FormattedMessage
              id="component.confirm-cancel-petition-approval-dialog.body"
              defaultMessage="All pending or completed approvals will be cancelled and will have to be started again. This action is not reversible."
            />
          </Text>
          <Text marginTop={1}>
            <FormattedMessage
              id="generic.confirm-continue"
              defaultMessage="Are you sure you want to continue?"
            />
          </Text>
        </Box>
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

export function useConfirmCancelPetitionApprovalDialog() {
  return useDialog(ConfirmCancelPetitionApprovalDialog);
}
