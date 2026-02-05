import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

function ConfirmUpdateAdverseMediaDialog({
  hasMonitoring,
  ...props
}: DialogProps<{ hasMonitoring: boolean }>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-update-adverse-media-dialog.header"
          defaultMessage="Modify reply"
        />
      }
      body={
        <Text>
          {hasMonitoring ? (
            <FormattedMessage
              id="component.confirm-update-adverse-media-dialog.body-with-monitoring"
              defaultMessage="If you continue, the saved search and its articles will be discarded, deleting both the monitoring and the stored version history, if any. Are you sure you want to discard this search?"
            />
          ) : (
            <FormattedMessage
              id="component.confirm-update-adverse-media-dialog.body"
              defaultMessage="This property supports only one response. If you add a new search, the previous one will be deleted. Are you sure you want to modify this answer?"
            />
          )}
        </Text>
      }
      confirm={
        <Button colorScheme={hasMonitoring ? "red" : "primary"} onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-update-adverse-media-dialog.yes-modify"
            defaultMessage="Yes, modify"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmUpdateAdverseMediaDialog() {
  return useDialog(ConfirmUpdateAdverseMediaDialog);
}
