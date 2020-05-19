import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeleteFieldDialog({ ...props }: DialogCallbacks<void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-delete-field.header"
          defaultMessage="Delete field"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-delete-field.body"
          defaultMessage="This field might contain collected replies. If you delete this field you will those replies including uploaded files <b>forever</b>."
          values={{
            b: (...chunks: any[]) => <b>{chunks}</b>,
          }}
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="generic.confirm-delete-button"
            defaultMessage="Yes, delete"
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
