import { Button, Checkbox, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { NetDocumentsLink } from "@parallel/components/common/NetDocumentsLink";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

interface AlreadyExportedDialogProps {
  filename: string;
  externalId: string;
}

function AlreadyExportedDialog({
  externalId,
  filename,
  ...props
}: DialogProps<AlreadyExportedDialogProps, { dontAskAgain: boolean; exportAgain: boolean }>) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      {...props}
      header={
        <FormattedMessage
          id="component.export-replies-progress-dialog.header"
          defaultMessage="This file has already been exported"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.export-replies-progress-dialog.body-1"
              defaultMessage="The file {filename} has already been exported to NetDocuments"
              values={{ filename: <Text as="strong">{filename}</Text> }}
            />
          </Text>
          <Text textAlign="center">
            <NetDocumentsLink externalId={externalId} />
          </Text>
          <Text>
            <FormattedMessage
              id="component.export-replies-progress-dialog.body2"
              defaultMessage="Do you want to export it again?"
            />
          </Text>
          <Checkbox isChecked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)}>
            <FormattedMessage id="generic.dont-ask-again" defaultMessage="Don't ask again" />
          </Checkbox>
        </Stack>
      }
      cancel={
        <Button onClick={() => props.onResolve({ dontAskAgain, exportAgain: false })}>
          <FormattedMessage id="generic.omit" defaultMessage="Omit" />
        </Button>
      }
      confirm={
        <Button
          colorScheme="primary"
          onClick={() => props.onResolve({ dontAskAgain, exportAgain: true })}
        >
          <FormattedMessage
            id="component.export-replies-progress-dialog.export-again"
            defaultMessage="Export again"
          />
        </Button>
      }
    />
  );
}

export function useAlreadyExportedDialog() {
  return useDialog(AlreadyExportedDialog);
}
