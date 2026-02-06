import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

export function PreviewPetitionFieldBackgroundCheckFalsePositivesDialog({
  ...props
}: DialogProps<{}>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.preview-petition-field-background-check-false-positives-dialog.header"
          defaultMessage="None of these results?"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.preview-petition-field-background-check-false-positives-dialog.body"
            defaultMessage="Mark them as false positives to keep evidence that they have been reviewed for a future audit."
          />
        </Text>
      }
      confirm={
        <Button onClick={() => props.onResolve()} colorPalette="primary" variant="solid">
          <FormattedMessage
            id="component.preview-petition-field-background-check-false-positives-dialog.button"
            defaultMessage="Mark as false positives"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewPetitionFieldBackgroundCheckFalsePositivesDialog() {
  return useDialog(PreviewPetitionFieldBackgroundCheckFalsePositivesDialog);
}
