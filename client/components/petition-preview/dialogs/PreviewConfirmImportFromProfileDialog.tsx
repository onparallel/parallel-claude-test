import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function PreviewConfirmImportFromProfileDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.preview-confirm-import-from-profile-dialog.header"
          defaultMessage="No information found"
        />
      }
      body={
        <>
          <Text>
            <FormattedMessage
              id="component.preview-confirm-import-from-profile-dialog.body"
              defaultMessage="The selected profile has no information available to import into the group."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.preview-confirm-import-from-profile-dialog.body-2"
              defaultMessage="If you continue, the current information in the fields related to this profile type will be overwritten and any existing data will be lost."
            />
          </Text>
        </>
      }
      confirm={
        <Button onClick={() => props.onResolve()} colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewConfirmImportFromProfileDialog() {
  return useDialog(PreviewConfirmImportFromProfileDialog);
}
