import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeleteDashboardDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      size="lg"
      header={
        <FormattedMessage
          id="component.confirm-delete-dashboard-dialog.header"
          defaultMessage="Delete dashboard"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-delete-dashboard-dialog.body"
              defaultMessage="If continue, the dashboard will be permanently deleted."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="generic.confirm-continue"
              defaultMessage="Are you sure you want to continue?"
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

export function useConfirmDeleteDashboardDialog() {
  return useDialog(ConfirmDeleteDashboardDialog);
}
