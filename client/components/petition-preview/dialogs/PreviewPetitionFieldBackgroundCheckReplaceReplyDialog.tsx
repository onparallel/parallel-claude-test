import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

export function PreviewPetitionFieldBackgroundCheckReplaceReplyDialog({
  ...props
}: DialogProps<{}>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.preview-petition-field-background-check-replace-reply-dialog.header"
          defaultMessage="Overwrite entity"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.preview-petition-field-background-check-replace-reply-dialog.body"
            defaultMessage="This field only admits one element. If you save a new one, the current one will be removed."
          />{" "}
          <FormattedMessage
            id="component.preview-petition-field-background-check-replace-reply-dialog.body-question"
            defaultMessage="Are you sure you want to <b>overwrite with this entity</b>?"
          />
        </Text>
      }
      confirm={
        <Button onClick={() => props.onResolve()} colorPalette="primary" variant="solid">
          <FormattedMessage
            id="component.preview-petition-field-background-check-replace-reply-dialog.yes-overwrite"
            defaultMessage="Yes, overwrite"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewPetitionFieldBackgroundCheckReplaceReplyDialog() {
  return useDialog(PreviewPetitionFieldBackgroundCheckReplaceReplyDialog);
}
