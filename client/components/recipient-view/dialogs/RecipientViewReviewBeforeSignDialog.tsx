import { Button } from "@chakra-ui/react";
import { Spacer } from "@parallel/components/common/Spacer";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Tone } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

function RecipientViewReviewBeforeSignDialog({
  name,
  tone,
  ...props
}: DialogProps<{ name: string; tone: Tone }>) {
  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      size="lg"
      header={
        <FormattedMessage
          id="component.recipient-view-review-before-sign-dialog.header"
          defaultMessage="Review and sign"
        />
      }
      body={
        <>
          <FormattedMessage
            id="component.recipient-view-review-before-sign-dialog.body-1"
            defaultMessage="This parallel requires an <b>eSignature</b> in order to be completed."
            values={{ tone }}
          />
          <Spacer marginTop={2} />
          <FormattedMessage
            id="component.recipient-view-review-before-sign-dialog.body-2"
            defaultMessage="{tone, select, INFORMAL{We have notified {name} to proceed with the review of the replies and once validated we will send an email with the document to people who has to sign it.} other{We have notified {name} to proceed with the review of the replies and once validated we will send an email with the document to sign by the appropriate people.}}"
            values={{
              name: <b>{name}</b>,
              tone,
            }}
          />
        </>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

export function useRecipientViewReviewBeforeSignDialog() {
  return useDialog(RecipientViewReviewBeforeSignDialog);
}
