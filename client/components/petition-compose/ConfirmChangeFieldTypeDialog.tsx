import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmChangeFieldTypeDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-change-field-type.header"
          defaultMessage="Change field type"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-change-field-type.body"
          defaultMessage="This field contains collected replies. If you change the type of this field you will lose those replies <b>forever</b>."
          values={{
            b: (chunks: any[]) => <b>{chunks}</b>,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-change-field-type.confirm"
            defaultMessage="Change type"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmChangeFieldTypeDialog() {
  return useDialog(ConfirmChangeFieldTypeDialog);
}
