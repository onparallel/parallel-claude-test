import { Button, Code, Heading, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export interface SignatureCancelledRequestErrorDialogProps {
  message: ReactNode;
  reason: string;
}

export function SignatureCancelledRequestErrorDialog({
  message,
  reason,
  ...props
}: DialogProps<SignatureCancelledRequestErrorDialogProps, void>) {
  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      closeOnEsc
      {...props}
      header={
        <Heading size="md">
          <FormattedMessage
            id="component.signature-cancelled-request-error-dialog.header"
            defaultMessage="Error sending"
          />
        </Heading>
      }
      body={
        <Stack>
          <Text>{message}</Text>
          <Code padding={4}>{reason}</Code>
        </Stack>
      }
      cancel={
        <Button colorScheme="primary" onClick={() => props.onReject()}>
          <FormattedMessage id="generic.ok" defaultMessage="OK" />
        </Button>
      }
      confirm={null}
    />
  );
}

export function useSignatureCancelledRequestErrorDialog() {
  return useDialog(SignatureCancelledRequestErrorDialog);
}
