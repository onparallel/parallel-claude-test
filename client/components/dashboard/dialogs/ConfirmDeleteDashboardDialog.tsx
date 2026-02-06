import { Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

export function ConfirmDeleteDashboardDialog({
  isOwner,
  ...props
}: DialogProps<{ isOwner: boolean }>) {
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
            {isOwner ? (
              <FormattedMessage
                id="component.confirm-delete-dashboard-dialog.body-owner"
                defaultMessage="If you continue, the dashboard will be permanently deleted for you and for every user that has access to it."
              />
            ) : (
              <FormattedMessage
                id="component.confirm-delete-dashboard-dialog.body-not-owner"
                defaultMessage="If you continue, you will lose access to the dashboard. Other users will still have access."
              />
            )}
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
        <Button colorPalette="red" onClick={() => props.onResolve()}>
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
