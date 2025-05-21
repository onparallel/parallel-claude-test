import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeleteAdverseMediaSearchDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-delete-adverse-media-search-dialog.header"
          defaultMessage="Delete adverse media search"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-delete-adverse-media-search-dialog.body"
          defaultMessage="All saved articles will be deleted. Are you sure you want to delete this adverse media search?"
        />
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

export function useConfirmDeleteAdverseMediaSearchDialog() {
  return useDialog(ConfirmDeleteAdverseMediaSearchDialog);
}
