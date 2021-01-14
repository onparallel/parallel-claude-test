import { Box, Button, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { FormattedMessage } from "react-intl";

export function RevokeAllAccessTokensDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="settings.api-tokens.confirm-revoke-all-tokens-dialog.header"
          defaultMessage="Revoke all access tokens"
        />
      }
      body={
        <Stack>
          <Box>
            <FormattedMessage
              id="settings.api-tokens.confirm-revoke-all-tokens-dialog.body"
              defaultMessage="Are you sure you want to revoke all personal access tokens?"
            />
          </Box>
          <Box>
            <FormattedMessage
              id="settings.api-tokens.confirm-delete-tokens-dialog.body-warning"
              defaultMessage="Any applications or scripts using this {plural, select, true {tokens} other {token}} will no longer be able to access the Parallel API. You cannot undo this action."
              values={{ plural: true }}
            />
          </Box>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="settings.api-tokens.confirm-revoke-all-tokens-dialog.confirm-button"
            defaultMessage="Yes, revoke all tokens"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useRevokeAllAccessTokensDialog() {
  return useDialog(RevokeAllAccessTokensDialog);
}
