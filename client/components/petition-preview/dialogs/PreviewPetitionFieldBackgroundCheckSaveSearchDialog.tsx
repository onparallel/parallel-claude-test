import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function PreviewPetitionFieldBackgroundCheckSaveSearchDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.preview-petition-field-background-check-save-search-dialog.header"
          defaultMessage="None of these results?"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.preview-petition-field-background-check-save-search-dialog.body"
            defaultMessage="In that case, you can close this page. Parallel has already automatically saved the search to preserve the evidence for a future audit."
          />
        </Text>
      }
      cancel={<></>}
      confirm={
        <Button onClick={() => props.onResolve()} colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.ok" defaultMessage="OK" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewPetitionFieldBackgroundCheckSaveSearchDialog() {
  return useDialog(PreviewPetitionFieldBackgroundCheckSaveSearchDialog);
}
