import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeactivateAccessDialog({
  nameOrEmail,
  ...props
}: { nameOrEmail: string } & DialogCallbacks<void>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-deactivate-access-message.header"
          defaultMessage="Remove contact access"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-deactivate-access-message.body"
          defaultMessage="Are you sure you want to remove access to {nameOrEmail}?"
          values={{ nameOrEmail }}
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-deactivate-access-message.confirm"
            defaultMessage="Yes, remove"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDeactivateAccessDialog() {
  return useDialog(ConfirmDeactivateAccessDialog);
}
