import { DateTime } from "@parallel/components/common/DateTime";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button } from "@parallel/components/ui";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";

function SignatureReminderAlreadySentDialog({
  ...props
}: DialogProps<{ sentAt: string; providerName: string }>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <FormattedMessage
          id="component.signature-reminder-already-sent-dialog.header"
          defaultMessage="Reminder already sent"
        />
      }
      body={
        <FormattedMessage
          id="component.signature-reminder-already-sent-dialog.body"
          defaultMessage="{providerName} only allows one reminder per day. The latest reminder was sent {timeAgo}."
          values={{
            providerName: props.providerName,
            timeAgo: (
              <DateTime value={props.sentAt} format={FORMATS.LLL} useRelativeTime="always" />
            ),
          }}
        />
      }
      cancel={<></>}
      confirm={
        <Button
          colorPalette="primary"
          onClick={() => {
            props.onResolve();
          }}
        >
          <FormattedMessage id="generic.ok" defaultMessage="OK" />
        </Button>
      }
    />
  );
}
export function useSignatureReminderAlreadySentDialog() {
  return useDialog(SignatureReminderAlreadySentDialog);
}
