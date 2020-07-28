import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useRouter } from "next/router";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";

export function CompletedPetitionDialog({ ...props }: DialogProps) {
  const focusRef = useRef(null);
  const router = useRouter();
  return (
    <ConfirmDialog
      initialFocusRef={focusRef}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="petition.completed-petition-dialog.header"
          defaultMessage="This petition is completed"
        />
      }
      body={
        <FormattedMessage
          id="petition.completed-petition-dialog.body"
          defaultMessage="This petition was already completed by the recipient. If you make any changes to the fields, the recipients will have to submit it again."
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.completed-petition-dialog.confirm-button"
            defaultMessage="I understand"
          />
        </Button>
      }
      cancel={
        <Button
          ref={focusRef}
          onClick={() => {
            props.onResolve();
            router.back();
          }}
        >
          <FormattedMessage
            id="generic.go-back-button"
            defaultMessage="Go back"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useCompletedPetitionDialog() {
  return useDialog(CompletedPetitionDialog);
}
