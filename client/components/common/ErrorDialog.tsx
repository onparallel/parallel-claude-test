import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { ReactNode, useRef } from "react";
import { FormattedMessage } from "react-intl";

export type ErrorDialogProps = {
  message: ReactNode;
};

export function ErrorDialog({
  message,
  ...props
}: DialogProps<ErrorDialogProps>) {
  const focusRef = useRef(null);
  return (
    <ConfirmDialog
      initialFocusRef={focusRef}
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        <FormattedMessage
          id="component.error-dialog.header"
          defaultMessage="Error"
        />
      }
      body={message}
      confirm={
        <Button
          ref={focusRef}
          colorScheme="purple"
          minWidth={24}
          onClick={() => props.onResolve()}
        >
          <FormattedMessage
            id="component.error-dialog.ok-button"
            defaultMessage="OK"
          />
        </Button>
      }
      cancel={null}
      {...props}
    />
  );
}

export function useErrorDialog() {
  return useDialog(ErrorDialog);
}
