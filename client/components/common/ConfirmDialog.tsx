import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  ButtonProps,
  Stack,
  BoxProps,
} from "@chakra-ui/core";
import { useRef, ReactNode, RefObject } from "react";
import { FormattedMessage } from "react-intl";
import { DialogCallbacks, Dialog } from "./DialogOpenerProvider";

export type ConfirmDialogProps<T> = {
  header: ReactNode;
  body: ReactNode;
  confirm: ReactNode;
  cancel?: ReactNode;
  focusRef?: RefObject<HTMLElement>;
} & DialogCallbacks<T> &
  BoxProps;

export function ConfirmDialog<T = void>({
  header,
  body,
  confirm,
  cancel,
  focusRef,
  onResolve,
  onReject,
  ...props
}: ConfirmDialogProps<T>) {
  const cancelRef = useRef<HTMLElement>(null);
  cancel = cancel || (
    <Button ref={cancelRef} onClick={() => onReject()}>
      {cancel ?? (
        <FormattedMessage
          id="component.confirm-dialog.cancel-button"
          defaultMessage="Cancel"
        />
      )}
    </Button>
  );
  return (
    <AlertDialog
      isOpen={true}
      leastDestructiveRef={focusRef || cancelRef}
      onClose={() => onReject()}
    >
      <AlertDialogOverlay />
      <AlertDialogContent {...props}>
        <AlertDialogHeader fontSize="lg" fontWeight="bold">
          {header}
        </AlertDialogHeader>
        <AlertDialogBody>{body}</AlertDialogBody>
        <AlertDialogFooter>
          <Stack direction="row">
            {cancel}
            {confirm}
          </Stack>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
