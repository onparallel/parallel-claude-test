import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmReactivateAccessDialog({
  nameOrEmail,
  ...props
}: DialogProps<{ nameOrEmail: string }>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petition.confirm-activate-access-message.header"
          defaultMessage="Reactivate contact access"
        />
      }
      body={
        <FormattedMessage
          id="petition.confirm-activate-access-message.body"
          defaultMessage="Are you sure you want to <b>reactivate access</b> to {nameOrEmail}?"
          values={{ nameOrEmail }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-activate-access-message.confirm"
            defaultMessage="Yes, activate access"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmReactivateAccessDialog() {
  return useDialog(ConfirmReactivateAccessDialog);
}
