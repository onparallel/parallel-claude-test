import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";

export function HiddenFieldDialog({ ...props }: DialogProps) {
  const focusRef = useRef<HTMLButtonElement>(null);

  return (
    <ConfirmDialog
      initialFocusRef={focusRef}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="component.hidden-field-dialog.header"
          defaultMessage="Field not visible"
        />
      }
      body={
        <FormattedMessage
          id="component.hidden-field-dialog.body"
          defaultMessage="The field you are trying to preview is not visible right now."
        />
      }
      confirm={
        <Button ref={focusRef} colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      {...props}
    />
  );
}

export function useHiddenFieldDialog() {
  return useDialog(HiddenFieldDialog);
}
