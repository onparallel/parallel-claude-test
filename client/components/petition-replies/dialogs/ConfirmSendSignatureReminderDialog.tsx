import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { SignerReference } from "@parallel/components/common/SignerReference";
import { SignerReference_PetitionSignerFragment } from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";

function ConfirmSendSignatureReminderDialog({
  pendingSigners,
  ...props
}: DialogProps<{ pendingSigners: SignerReference_PetitionSignerFragment[] }, boolean>) {
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
                value={pendingSigners.map((signer, index) => (
                  <SignerReference key={index} signer={signer} fontWeight="bold" />
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
