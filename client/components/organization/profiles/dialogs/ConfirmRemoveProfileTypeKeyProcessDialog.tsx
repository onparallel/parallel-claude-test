import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

function ConfirmRemoveProfileTypeKeyProcessDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-remove-profile-type-key-process-dialog.header"
          defaultMessage="Do you want to remove this main process?"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.confirm-remove-profile-type-key-process-dialog.body"
            defaultMessage="No parallel or association will be deleted, they will only no longer be highlighted in the profile."
          />
        </Text>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-remove-button" defaultMessage="Yes, remove" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmRemoveProfileTypeKeyProcessDialog() {
  return useDialog(ConfirmRemoveProfileTypeKeyProcessDialog);
}
