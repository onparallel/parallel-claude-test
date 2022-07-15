import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";

export function ConfirmDiscardChangesDialog({ ...props }: DialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="components.confirm-discard-changes-dialog.header"
          defaultMessage="Unsaved changes"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="components.confirm-discard-changes-dialog.body"
              defaultMessage="You have unsaved changes. Would you like to discard them?"
            />
          </Text>
        </Stack>
      }
      initialFocusRef={cancelRef}
      cancel={
        <Button ref={cancelRef} onClick={() => props.onReject()}>
          <FormattedMessage
            id="components.confirm-discard-changes-dialog.cancel"
            defaultMessage="Stay"
          />
        </Button>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="components.confirm-discard-changes-dialog.confirm"
            defaultMessage="Discard and continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDiscardChangesDialog() {
  return useDialog(ConfirmDiscardChangesDialog);
}
