import { Button } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";

export function PublicTemplateDialog({ ...props }: DialogProps) {
  const focusRef = useRef<HTMLButtonElement>(null);

  return (
    <ConfirmDialog
      initialFocusRef={focusRef}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="petition.public-template-dialog.header"
          defaultMessage="Edition restricted"
        />
      }
      body={
        <FormattedMessage
          id="petition.public-template-dialog.body"
          defaultMessage="This is a public template and edition is blocked. If you want to make any changes, please contact us."
        />
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.i-understand" defaultMessage="I understand" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

export function usePublicTemplateDialog() {
  return useDialog(PublicTemplateDialog);
}
