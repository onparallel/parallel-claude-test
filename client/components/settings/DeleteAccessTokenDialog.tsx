import { Box, Button, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { FormattedMessage } from "react-intl";

export function DeleteAccessTokenDialog({
  plural,
  ...props
}: DialogProps & { plural: boolean }) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="settings.api-tokens.confirm-delete-token-dialog.header"
          defaultMessage="Revoke access {plural, select, true {tokens} other {token}}"
          values={{ plural }}
        />
      }
      body={
        <Stack>
          <Box>
            <FormattedMessage
              id="settings.api-tokens.confirm-delete-token-dialog.body-1"
              defaultMessage="Are you sure you want to delete this {plural, select, true {tokens} other {token}}?"
              values={{ plural }}
            />
          </Box>
          <Box>
            <FormattedMessage
              id="settings.api-tokens.confirm-delete-tokens-dialog.body-warning"
              defaultMessage="Any applications or scripts using this {plural, select, true {tokens} other {token}} will no longer be able to access the Parallel API. You cannot undo this action."
              values={{ plural }}
            />
          </Box>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="generic.confirm-delete-button"
            defaultMessage="Yes, delete"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useDeleteAccessTokenDialog() {
  return useDialog(DeleteAccessTokenDialog);
}
