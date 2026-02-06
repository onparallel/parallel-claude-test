import { useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";
import { PathName } from "../../common/PathName";
import { GenericFolderDialog, GenericFolderDialogProps } from "./GenericFolderDialog";

type MoveToFolderDialogProps = Omit<GenericFolderDialogProps, "header" | "body" | "confirm">;

function MoveToFolderDialog(props: MoveToFolderDialogProps) {
  return (
    <GenericFolderDialog
      {...props}
      header={() => <FormattedMessage id="generic.move-to" defaultMessage="Move to..." />}
      body={({ currentPath, type, selectedPath }) => (
        <Text marginBottom={2}>
          {currentPath !== selectedPath ? (
            <FormattedMessage
              id="component.move-to-folder-dialog.will-move-from"
              defaultMessage="Will move from {source} to {destination}"
              values={{
                source: <PathName as="strong" path={currentPath} type={type}></PathName>,
                destination: <PathName as="strong" path={selectedPath} type={type}></PathName>,
              }}
            />
          ) : (
            <FormattedMessage
              id="component.move-to-folder-dialog.currently-in"
              defaultMessage="Currently in {folder}"
              values={{
                folder: <PathName as="strong" path={currentPath} type={type}></PathName>,
              }}
            />
          )}
        </Text>
      )}
      confirm={({ onResolve, selectedPath }) => (
        <Button colorPalette="primary" onClick={() => onResolve(selectedPath)}>
          <FormattedMessage id="component.move-to-folder-dialog.move" defaultMessage="Move" />
        </Button>
      )}
    />
  );
}

export function useMoveToFolderDialog() {
  return useDialog(MoveToFolderDialog);
}
