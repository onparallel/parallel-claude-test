import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmOverwriteOptionsDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-overwrite-options-dialog.header"
          defaultMessage="Overwrite options"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-overwrite-options-dialog.body"
              defaultMessage="This field has options added. If you continue, they will be overwritten with the ones from the provided list."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.confirm-overwrite-options-dialog.confirm"
              defaultMessage="Are you sure you want to continue?"
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmOverwriteOptionsDialog() {
  return useDialog(ConfirmOverwriteOptionsDialog);
}
