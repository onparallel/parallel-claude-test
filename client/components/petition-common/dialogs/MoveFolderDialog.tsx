import { Button, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

interface MoveFolderDialogProps {
  selectedFolder: string | null;
}

interface MoveFolderDialogData {
  newName: string;
}

function MoveFolderDialog({
  selectedFolder,
  ...props
}: DialogProps<MoveFolderDialogProps, MoveFolderDialogData>) {
  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      content={
        {
          as: "form",
          onSubmit: () => {},
        } as any
      }
      {...props}
      header={
        <FormattedMessage id="component.move-folder-dialog.header" defaultMessage="Move to..." />
      }
      body={<Stack></Stack>}
      confirm={
        <Button colorScheme="primary" isDisabled={false} type="submit">
          <FormattedMessage id="component.move-folder-dialog.move" defaultMessage="Move" />
        </Button>
      }
    />
  );
}

export function useMoveFolderDialog() {
  return useDialog(MoveFolderDialog);
}
