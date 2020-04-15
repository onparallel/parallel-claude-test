import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  BoxProps,
  Button,
  Stack,
  IAlertDialog,
} from "@chakra-ui/core";
import { ReactNode, RefObject, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { DialogCallbacks } from "./DialogOpenerProvider";

export type ConfirmDialogProps<T> = {
  header: ReactNode;
  body: ReactNode;
  confirm: ReactNode;
  cancel?: ReactNode;
  focusRef?: RefObject<HTMLElement>;
  content?: BoxProps;
} & DialogCallbacks<T> &
  Omit<IAlertDialog, "children" | "isOpen" | "leastDestructiveRef" | "onClose">;

export function ConfirmDialog<T = void>({
  header,
  body,
  confirm,
  cancel,
  focusRef,
  onResolve,
  onReject,
  content,
  ...props
}: ConfirmDialogProps<T>) {
  const cancelRef = useRef<HTMLElement>(null);
  cancel = cancel || (
    <Button ref={cancelRef} onClick={() => onReject()}>
      <FormattedMessage
        id="component.confirm-dialog.cancel-button"
        defaultMessage="Cancel"
      />
    </Button>
  );
  return (
    <AlertDialog
      isOpen={true}
      leastDestructiveRef={focusRef || cancelRef}
      onClose={() => onReject()}
      {...props}
    >
      <AlertDialogOverlay />
      <AlertDialogContent {...content}>
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
