import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmActivateAccessDialog({
  nameOrEmail,
  ...props
}: { nameOrEmail: string } & DialogCallbacks<void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-activate-access-message.header"
          defaultMessage="Activate contact access"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-activate-access-message.body"
          defaultMessage="Are you sure you want to activate access to {nameOrEmail}?"
          values={{ nameOrEmail }}
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-activate-access-message.confirm"
            defaultMessage="Yes, activate"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmActivateAccessDialog() {
  return useDialog(ConfirmActivateAccessDialog);
}
