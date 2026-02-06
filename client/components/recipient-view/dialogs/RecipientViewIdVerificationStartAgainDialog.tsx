import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { Button, Text } from "@parallel/components/ui";
import { Tone } from "@parallel/graphql/__types";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { DialogProps, useDialog } from "../../common/dialogs/DialogProvider";

function RecipientViewIdVerificationStartAgainDialog({
  tone,
  ...props
}: DialogProps<{ tone: Tone }>) {
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      initialFocusRef={focusRef}
      header={
        <FormattedMessage
          id="component.recipient-view-id-verification-start-again-dialog.header"
          defaultMessage="Start over"
        />
      }
      body={
        <>
          <Text>
            <FormattedMessage
              id="component.recipient-view-id-verification-start-again-dialog.body-1"
              defaultMessage="If you continue, you will start the verification process again."
              values={{ tone }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.recipient-view-id-verification-start-again-dialog.body-2"
              defaultMessage="Once completed, the current document will be overwritten with the new one."
            />
          </Text>
        </>
      }
      confirm={
        <Button ref={focusRef} colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}

export function useRecipientViewIdVerificationStartAgainDialog() {
  return useDialog(RecipientViewIdVerificationStartAgainDialog);
}
