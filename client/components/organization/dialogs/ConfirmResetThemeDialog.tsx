import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmResetThemeDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-reset-theme.header"
          defaultMessage="Restore defaults"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="petition.confirm-reset-theme.body"
              defaultMessage="If you proceed all font settings will revert to the default value."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-restore-button" defaultMessage="Yes, restore" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmResetThemeDialog() {
  return useDialog(ConfirmResetThemeDialog);
}
