import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmDeleteVariableDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-delete-variable-dialog.header"
          defaultMessage="Delete variable"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.confirm-delete-variable-dialog.body"
            defaultMessage="If you continue, the variable will be lost and cannot be used in any calculations. Are you sure you want to delete it?"
          />
        </Text>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.delete" defaultMessage="Delete" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeleteVariableDialog() {
  return useDialog(ConfirmDeleteVariableDialog);
}
