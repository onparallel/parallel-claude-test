import { Button, Stack, Text } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function PreviewConfirmImportFromProfileDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      header={
        <Stack direction="row" spacing={2} align="center">
          <AlertCircleIcon role="presentation" />
          <Text>
            <FormattedMessage
              id="component.preview-confirm-import-from-profile-dialog.header"
              defaultMessage="No information found"
            />
          </Text>
        </Stack>
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
              defaultMessage="If you continue, the profile will be associated with the parallel, but existing responses in fields linked to the profile type will be deleted."
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
