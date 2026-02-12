import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { Stack, Text } from "@parallel/components/ui";

export function useDeleteWebhookSignatureKeysDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(async () => {
    return await showDialog({
      header: (
        <FormattedMessage
          id="component.delete-webhook-signature-keys-dialog.confirm-delete-header"
          defaultMessage="Delete signature key"
        />
      ),

      description: (
        <Stack>
          <Text>
            <FormattedMessage
              id="component.delete-webhook-signature-keys-dialog.confirm-delete-body"
              defaultMessage="Are you sure you want to delete the selected key?"
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.delete-webhook-signature-keys-dialog.confirm-delete-warning"
              defaultMessage="Before you proceed, make sure you are not using this key to verify received events, as it will not be valid anymore."
            />
          </Text>
        </Stack>
      ),
    });
  }, []);
}
