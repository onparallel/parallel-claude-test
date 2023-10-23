import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmLinkFieldDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-link-field-dialog.header"
          defaultMessage="Add field to group"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-link-field-dialog.body"
          defaultMessage="This field contains collected replies. If you add this field you will lose those replies including uploaded files <b>forever</b>."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-link-field-dialog.confirm"
            defaultMessage="Add to group"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmLinkFieldDialog() {
  return useDialog(ConfirmLinkFieldDialog);
}
