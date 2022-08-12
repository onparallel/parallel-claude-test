import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { Tone } from "@parallel/graphql/__types";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { DialogProps, useDialog } from "../../common/dialogs/DialogProvider";

function OverwriteDocumentationDialog({ tone, ...props }: DialogProps<{ tone: Tone }>) {
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      initialFocusRef={focusRef}
      header={
        <FormattedMessage
          id="component.overwrite-documentation-dialog.header"
          defaultMessage="Overwrite documentation"
        />
      }
      body={
        <FormattedMessage
          id="component.overwrite-documentation-dialog.body"
          defaultMessage="An upload has already been completed. If you continue, you will return to the initial process and the current documentation will be overwritten. Are you sure you want to start over?"
          values={{ tone }}
        />
      }
      confirm={
        <Button ref={focusRef} colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.overwrite-documentation-dialog.confirm-button"
            defaultMessage="Yes, start again"
          />
        </Button>
      }
    />
  );
}

export function useOverwriteDocumentationDialog() {
  return useDialog(OverwriteDocumentationDialog);
}
