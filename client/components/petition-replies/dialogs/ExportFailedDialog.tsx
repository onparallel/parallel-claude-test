import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage } from "react-intl";

interface ExportFailedDialogProps extends DialogProps {
  fileName: string;
  fieldName?: Maybe<string>;
}

function ExportFailedDialog({ fileName, fieldName, ...props }: ExportFailedDialogProps) {
  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      header={
        <Text>
          <FormattedMessage
            id="component.export-failed-dialog.heading"
            defaultMessage="Export failed"
          />
        </Text>
      }
      body={
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.export-failed-dialog.body"
            defaultMessage="Exporting to LocalAPI of the file {fileName} on field {fieldName} has failed."
            values={{
              fileName: <span style={{ fontWeight: "bold" }}>{fileName}</span>,
              fieldName: fieldName ?? (
                <span style={{ fontStyle: "italic" }}>
                  <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
                </span>
              ),
            }}
          />
        </Text>
      }
      confirm={
        <Button onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.export-failed-dialog.confirm"
            defaultMessage="Omit file and continue"
          />
        </Button>
      }
      cancel={
        <Button colorPalette="red" onClick={() => props.onReject()}>
          <FormattedMessage
            id="component.export-failed-dialog.cancel"
            defaultMessage="Stop export"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useExportFailedDialog() {
  return useDialog(ExportFailedDialog);
}
