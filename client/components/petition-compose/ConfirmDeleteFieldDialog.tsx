import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeleteFieldDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage id="petition.confirm-delete-field.header" defaultMessage="Delete field" />
      }
      body={
        <FormattedMessage
          id="petition.confirm-delete-field.body"
          defaultMessage="This field contains collected replies. If you delete this field you will lose those replies including uploaded files <b>forever</b>."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-delete-field.confirm"
            defaultMessage="Delete field"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeleteFieldDialog() {
  return useDialog(ConfirmDeleteFieldDialog);
}
