import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeleteThemeDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage id="petition.confirm-delete-theme.header" defaultMessage="Delete theme" />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="petition.confirm-delete-theme.body"
              defaultMessage="If you delete this theme all templates and petitions that are using it will revert to the default theme."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="petition.confirm-delete-theme.confirm"
              defaultMessage="Are you sure you want to delete it?"
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeleteThemeDialog() {
  return useDialog(ConfirmDeleteThemeDialog);
}
