import { Button, Text } from "@chakra-ui/react";
import { FormattedList, FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";

function ConfirmSendSignatureReminderDialog({
  pendingSignerNames,
  ...props
}: DialogProps<{ pendingSignerNames: string[] }, boolean>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <FormattedMessage
          id="component.confirm-send-signature-reminder.header"
          defaultMessage="Send signature reminder"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-send-signature-reminder.body"
          defaultMessage="{contactsList} {count, plural, =1{has} other{have}} not yet signed the document. Do you want to send a reminder to sign it?"
          values={{
            count: pendingSignerNames.length,
            contactsList: (
              <FormattedList
                value={pendingSignerNames.map((signerName, i) => [
                  <Text as="strong" key={i}>
                    {signerName}
                  </Text>,
                ])}
              />
            ),
          }}
        />
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve(true)}>
          <FormattedMessage
            id="component.confirm-send-signature-reminder.confirm"
            defaultMessage="Yes, send"
          />
        </Button>
      }
    />
  );
}
export function useConfirmSendSignatureReminderDialog() {
  return useDialog(ConfirmSendSignatureReminderDialog);
}
