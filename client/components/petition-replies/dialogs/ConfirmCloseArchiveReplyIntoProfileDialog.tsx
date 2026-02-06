import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

function ConfirmCloseArchiveReplyIntoProfileDialog({ ...props }: DialogProps<{}>) {
  return (
    <ConfirmDialog
      {...props}
      header={
        <FormattedMessage
          id="component.confirm-close-archive-reply-into-profile-dialog.header"
          defaultMessage="Unsaved information"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-close-archive-reply-into-profile-dialog.body"
          defaultMessage="You have selected profiles without saving. If you don't save now you can go back from the Associate profiles button. Do you want to continue without saving?"
        />
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button colorPalette="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}
export function useConfirmCloseArchiveReplyIntoProfileDialog() {
  return useDialog(ConfirmCloseArchiveReplyIntoProfileDialog);
}
