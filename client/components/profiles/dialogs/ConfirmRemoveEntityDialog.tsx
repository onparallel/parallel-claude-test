import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

function ConfirmRemoveEntityDialog({
  hasMonitoring,
  ...props
}: DialogProps<{ hasMonitoring: boolean }>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-remove-entity-dialog.header"
          defaultMessage="Remove entity"
        />
      }
      body={
        <Text>
          {hasMonitoring ? (
            <FormattedMessage
              id="component.confirm-remove-entity-dialog.body-with-monitoring"
              defaultMessage="If you proceed, the saved entity will be deleted, interrupting monitoring and erasing the search history, if any. Are you sure you want to remove this entity?"
            />
          ) : (
            <FormattedMessage
              id="component.confirm-remove-entity-dialog.body-without-monitoring"
              defaultMessage="If you proceed, the saved entity will be deleted. Are you sure you want to remove this entity?"
            />
          )}
        </Text>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-remove-entity-dialog.remove"
            defaultMessage="Remove"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmRemoveEntityDialog() {
  return useDialog(ConfirmRemoveEntityDialog);
}
