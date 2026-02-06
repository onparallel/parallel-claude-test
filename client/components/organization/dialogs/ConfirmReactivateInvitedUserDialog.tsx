import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Stack, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

interface ConfirmReactivateInvitedUserDialogProps {
  fullName: string;
}

function ConfirmReactivateInvitedUserDialog({
  fullName,
  ...props
}: DialogProps<ConfirmReactivateInvitedUserDialogProps>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-reactivate-invited-user-dialog.header"
          defaultMessage="User is already registered"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-reactivate-invited-user-dialog.body-1"
              defaultMessage="{fullName} is already registered in your organization, but has been previously deactivated and does not have access to Parallel."
              values={{
                fullName: <Text as="strong">{fullName}</Text>,
              }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.confirm-reactivate-invited-user-dialog.body-2"
              defaultMessage="Do you want to reactivate this user?"
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorPalette="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-reactivate-invited-user-dialog.confirm"
            defaultMessage="Yes, reactivate"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmReactivateInvitedUserDialog() {
  return useDialog(ConfirmReactivateInvitedUserDialog);
}
