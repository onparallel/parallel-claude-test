import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { FormattedMessage } from "react-intl";

export function ConfirmDeactivateAccessDialog({
  nameOrEmail,
  ...props
}: DialogProps<{ nameOrEmail: string }>) {
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
          defaultMessage="Are you sure you want to <b>remove access</b> to {nameOrEmail}?"
          values={{
            nameOrEmail,
            b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.confirm-deactivate-access-message.confirm"
            defaultMessage="Yes, remove access"
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
