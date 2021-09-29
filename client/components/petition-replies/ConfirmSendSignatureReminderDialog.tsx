import { Button } from "@chakra-ui/react";
import { ContactReference_ContactFragment } from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { ContactReference } from "../common/ContactReference";
import { DialogProps, useDialog } from "../common/DialogProvider";

function ConfirmSendSignatureReminderDialog({
  pendingSigners,
  ...props
}: DialogProps<{ pendingSigners: ContactReference_ContactFragment[] }, boolean>) {
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
            count: pendingSigners.length,
            contactsList: (
              <FormattedList
                value={pendingSigners.map((signer) => (
                  <ContactReference
                    key={signer.id}
                    contact={signer}
                    isLink={false}
                    fontWeight="bold"
                  />
                ))}
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
