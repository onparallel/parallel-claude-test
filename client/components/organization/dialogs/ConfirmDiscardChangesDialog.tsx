import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { noop } from "remeda";

export function ConfirmDiscardChangesDialog({ ...props }: DialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.confirm-discard-changes-dialog.header"
          defaultMessage="Unsaved changes"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-discard-changes-dialog.body"
              defaultMessage="You have unsaved changes. Would you like to discard them?"
            />
          </Text>
        </Stack>
      }
      initialFocusRef={cancelRef}
      cancel={
        <Button ref={cancelRef} onClick={() => props.onReject()}>
          <FormattedMessage
            id="component.confirm-discard-changes-dialog.cancel"
            defaultMessage="Stay"
          />
        </Button>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.confirm-discard-changes-dialog.confirm"
            defaultMessage="Discard and continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDiscardChangesDialog() {
  return useDialog(ConfirmDiscardChangesDialog);
}

export function useAutoConfirmDiscardChangesDialog(dialogShouldShow: boolean) {
  const showConfirmDiscardChangesDialog = useConfirmDiscardChangesDialog();
  const dialogShouldShowRef = useUpdatingRef(dialogShouldShow);
  const router = useRouter();
  useEffect(() => {
    let omitNextRouteChange = false;
    async function confirmRouteChange(path: string) {
      try {
        await showConfirmDiscardChangesDialog({});
        omitNextRouteChange = true;
        router.push(path);
      } catch {}
    }
    function handleRouteChangeStart(path: string) {
      if (omitNextRouteChange) {
        return;
      }
      if (dialogShouldShowRef.current) {
        confirmRouteChange(path).then(noop);
        router.events.emit("routeChangeError");
        throw "CANCEL_ROUTE_CHANGE";
      }
    }
    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, []);
}
