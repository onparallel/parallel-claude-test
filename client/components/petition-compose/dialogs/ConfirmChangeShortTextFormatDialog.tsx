import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmChangeShortTextFormatDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-change-short-text-format.header"
          defaultMessage="Change format type"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-change-short-text-format.body"
          defaultMessage="This field contains collected replies. If you change the format of this field you will lose those replies <b>forever</b>."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-change-short-text-format.confirm"
            defaultMessage="Change format"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmChangeShortTextFormatDialog() {
  return useDialog(ConfirmChangeShortTextFormatDialog);
}
