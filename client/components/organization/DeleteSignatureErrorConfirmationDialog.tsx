import { Button } from "@chakra-ui/button";
import { Text } from "@chakra-ui/layout";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";

function DeleteSignatureErrorConfirmationDialog({ ...props }: DialogProps) {
  const signaturesOpen = 3;
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
            defaultMessage="We have detected <b>{count}</b> pending signature processes that use this token. If you delete it, they will all be cancelled. Are you sure you want to delete it?"
            values={{ count: signaturesOpen }}
          />
        </Text>
      }
      confirm={
        <Button type="submit" colorScheme="red" variant="solid" onClick={() => props.onResolve()}>
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
