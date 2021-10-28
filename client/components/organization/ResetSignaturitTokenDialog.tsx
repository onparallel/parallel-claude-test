import { Button } from "@chakra-ui/button";
import { Text } from "@chakra-ui/layout";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";

function ResetSignaturitTokenDialog({ ...props }: DialogProps) {
  return (
    <ConfirmDialog
      hasCloseButton
      header={
        <Text>
          <FormattedMessage
            id="component.reset-signaturit-dialog.title"
            defaultMessage="Reset access token"
          />
        </Text>
      }
      body={
        <Text>
          <FormattedMessage
            id="component.reset-signaturit-dialog.body"
            defaultMessage="Are you sure you want to reset your token? If continue, the signature will be deactivated and you will return to test mode. "
          />
        </Text>
      }
      confirm={
        <Button type="submit" colorScheme="red" variant="solid" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.yes-reset" defaultMessage="Yest, reset" />
        </Button>
      }
      {...props}
    />
  );
}

export function useResetSignaturitTokenDialog() {
  return useDialog(ResetSignaturitTokenDialog);
}
