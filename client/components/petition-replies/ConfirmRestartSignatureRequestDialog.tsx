import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";

function ConfirmRestartSignatureRequestDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      size="md"
      header={
        <FormattedMessage
          id="component.confirm-restart-signature-request.header"
          defaultMessage="Restart eSignature process"
        />
      }
      body={
        <FormattedMessage
          id="component.confirm-restart-signature-request.description"
          defaultMessage="You already have a signed petition. If you continue you will spend an additional eSignature credit. Are you sure you want to continue?"
        />
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmRestartSignatureRequestDialog() {
  return useDialog(ConfirmRestartSignatureRequestDialog);
}
