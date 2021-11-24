import { Button } from "@chakra-ui/button";
import { Text } from "@chakra-ui/layout";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export type DeleteSignatureErrorConfirmationDialogProps = {
  pendingSignaturesCount: number;
};

function DeleteSignatureErrorConfirmationDialog({
  pendingSignaturesCount,
  ...props
}: DialogProps<DeleteSignatureErrorConfirmationDialogProps, void>) {
  return (
    <ConfirmDialog
      hasCloseButton
      header={
        <Text>
          <FormattedMessage
            id="component.delete-signature-error-confirmation.title"
            defaultMessage="Pending signatures"
          />
        </Text>
      }
      body={
        <Text>
          <FormattedMessage
            id="component.delete-signature-error-confirmation.body"
            defaultMessage="We have detected <b>{count}</b> petitions or templates using this token. If you delete it, the configuration will be reset and all pending signature processes will be cancelled. Are you sure you want to delete it?"
            values={{ count: pendingSignaturesCount }}
          />
        </Text>
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

export function useDeleteSignatureErrorConfirmationDialog() {
  return useDialog(DeleteSignatureErrorConfirmationDialog);
}
