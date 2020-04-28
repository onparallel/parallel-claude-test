import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { ReactNode, useRef } from "react";
import { FormattedMessage } from "react-intl";

export function ErrorDialog({
  message,
  ...props
}: { message: ReactNode } & DialogCallbacks<void>) {
  const focusRef = useRef(null);
  return (
    <ConfirmDialog
      focusRef={focusRef}
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
          variantColor="purple"
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
