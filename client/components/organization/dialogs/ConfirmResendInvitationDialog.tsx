import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

function ConfirmResendInvitationDialog({ fullName, ...props }: DialogProps<{ fullName: string }>) {
  return (
    <ConfirmDialog
      hasCloseButton
      size="lg"
      content={{
        as: "form",
        onSubmit: () => {
          props.onResolve();
        },
      }}
      header={
        <Text>
          <FormattedMessage
            id="component.confirm-resend-invitation-dialog.title"
            defaultMessage="Resend invitation"
          />
        </Text>
      }
      body={
        <Stack spacing={2}>
          <Text>
            <FormattedMessage
              id="component.confirm-resend-invitation-dialog.user-not-yet-activated"
              defaultMessage="{fullName} has not yet activated his account."
              values={{
                fullName,
              }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.confirm-resend-invitation-dialog.resend-invitation-question"
              defaultMessage="Do you want to resend the invitation to log in?"
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple">
          <FormattedMessage id="generic.confirm-send" defaultMessage="Yes, send" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmResendInvitationDialog() {
  return useDialog(ConfirmResendInvitationDialog);
}
