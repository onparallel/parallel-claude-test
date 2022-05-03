import { Button, Stack, Text } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ReactNode, useRef } from "react";
import { FormattedMessage } from "react-intl";

export type ErrorDialogProps = {
  message: ReactNode;
  header?: ReactNode;
};

export function ErrorDialog({ message, header, ...props }: DialogProps<ErrorDialogProps>) {
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      initialFocusRef={focusRef}
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        header ?? (
          <Stack direction="row" spacing={2} align="center">
            <AlertCircleIcon role="presentation" />
            <Text>
              <FormattedMessage id="component.error-dialog.header" defaultMessage="Error" />
            </Text>
          </Stack>
        )
      }
      body={message}
      confirm={
        <Button ref={focusRef} colorScheme="purple" minWidth={24} onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.ok" defaultMessage="OK" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

export function useErrorDialog() {
  return useDialog(ErrorDialog);
}
