import { Button } from "@chakra-ui/button";
import { Text } from "@chakra-ui/layout";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function DeleteSignatureTokenDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      hasCloseButton
      header={
        <Text>
          <FormattedMessage
            id="component.remove-signature-token-dialog.title"
            defaultMessage="Delete token"
          />
        </Text>
      }
      body={
        <Text>
          <FormattedMessage
            id="component.remove-signature-token-dialog.body"
            defaultMessage="If you delete this token you will not be able to use this integration again, are you sure you want to delete it?"
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

export function useDeleteSignatureTokenDialog() {
  return useDialog(DeleteSignatureTokenDialog);
}
