import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { Button } from "@parallel/components/ui";
import { Tone } from "@parallel/graphql/__types";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { DialogProps, useDialog } from "../../common/dialogs/DialogProvider";

function EsTaxDocumentsChangePersonDialog({ tone, ...props }: DialogProps<{ tone: Tone }>) {
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      initialFocusRef={focusRef}
      header={
        <FormattedMessage
          id="component.es-tax-documents-change-person-dialog.header"
          defaultMessage="Change person"
        />
      }
      body={
        <FormattedMessage
          id="component.es-tax-documents-change-person-dialog.body"
          defaultMessage="Continue to delete all documents and obtain the data of another person."
          values={{ tone }}
        />
      }
      confirm={
        <Button ref={focusRef} colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.es-tax-documents-change-person-dialog.confirm-button"
            defaultMessage="Delete and start again"
          />
        </Button>
      }
    />
  );
}

export function useEsTaxDocumentsChangePersonDialog() {
  return useDialog(EsTaxDocumentsChangePersonDialog);
}
