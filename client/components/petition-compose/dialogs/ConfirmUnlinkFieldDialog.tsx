import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

function ConfirmUnlinkFieldDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-unlink-field-dialog.header"
          defaultMessage="Remove field from group"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-unlink-field-dialog.body"
          defaultMessage="This field contains collected replies. If you remove this field you will lose those replies including uploaded files <b>forever</b>."
        />
      }
      confirm={
        <Button colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-unlink-field-dialog.confirm"
            defaultMessage="Remove from group"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmUnlinkFieldDialog() {
  return useDialog(ConfirmUnlinkFieldDialog);
}
