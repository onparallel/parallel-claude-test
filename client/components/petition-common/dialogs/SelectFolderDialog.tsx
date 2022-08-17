import { Button, Text } from "@chakra-ui/react";
import { useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";
import { GenericFolderDialog, GenericFolderDialogProps } from "./GenericFolderDialog";
import { PathName } from "../../common/PathName";

type SelectFolderDialogProps = Omit<GenericFolderDialogProps, "header" | "body" | "confirm">;

function SelectFolderDialog(props: SelectFolderDialogProps) {
  return (
    <GenericFolderDialog
      {...props}
      header={() => (
        <FormattedMessage
          id="component.select-folder-dialog.header"
          defaultMessage="Select folder"
        />
      )}
      body={({ currentPath, type }) => (
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.select-folder-dialog.currently-in"
            defaultMessage="Current folder: {folder}"
            values={{
              folder: <PathName as="strong" path={currentPath} type={type}></PathName>,
            }}
          />
        </Text>
      )}
      confirm={({ onResolve, selectedPath }) => (
        <Button colorScheme="primary" onClick={() => onResolve(selectedPath)}>
          <FormattedMessage id="generic.select" defaultMessage="Select" />
        </Button>
      )}
    />
  );
}

export function useSelectFolderDialog() {
  return useDialog(SelectFolderDialog);
}
