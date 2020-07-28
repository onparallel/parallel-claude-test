import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmCancelScheduledMessageDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-cancel-scheduled-message.header"
          defaultMessage="Cancel scheduled message"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-cancel-scheduled-message.body"
          defaultMessage="Are you sure you want to cancel this message?"
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-cancel-scheduled-message.confirm"
            defaultMessage="Yes, cancel message"
          />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage
            id="petition.confirm-cancel-scheduled-message.cancel"
            defaultMessage="No, continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmCancelScheduledMessageDialog() {
  return useDialog(ConfirmCancelScheduledMessageDialog);
}
