import { Button, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmReactivateAccessDialog({
  nameOrEmail,
  ...props
}: { nameOrEmail: string } & DialogProps<void>) {
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
          values={{
            nameOrEmail,
            b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
          }}
        />
      }
      confirm={
        <Button variantColor="red" onClick={() => props.onResolve()}>
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
