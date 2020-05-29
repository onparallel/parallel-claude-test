import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  BoxProps,
  Button,
  IAlertDialog,
  Stack,
} from "@chakra-ui/core";
import { ReactNode, RefObject, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { DialogProps } from "./DialogOpenerProvider";

export type ConfirmDialogProps<T> = {
  header: ReactNode;
  body: ReactNode;
  confirm: ReactNode;
  cancel?: ReactNode;
  focusRef?: RefObject<HTMLElement>;
  content?: BoxProps;
} & DialogProps<T> &
  Omit<IAlertDialog, "children" | "isOpen" | "leastDestructiveRef" | "onClose">;

export function ConfirmDialog<T = void>({
  header,
  body,
  confirm,
  cancel,
  focusRef,
  position,
  onResolve,
  onReject,
  content,
  ...props
}: ConfirmDialogProps<T>) {
  const cancelRef = useRef<HTMLElement>(null);
  cancel =
    cancel === undefined ? (
      <Button ref={cancelRef} onClick={() => onReject()}>
        <FormattedMessage
          id="component.confirm-dialog.cancel-button"
          defaultMessage="Cancel"
        />
      </Button>
    ) : (
      cancel
    );
  return (
    <>
      <AlertDialog
        isOpen={true}
        leastDestructiveRef={focusRef || cancelRef}
        onClose={() => onReject()}
        {...props}
      >
        <AlertDialogOverlay zIndex={1400 + position * 2} />
        <AlertDialogContent
          rounded="md"
          zIndex={1400 + position * 2 + 1}
          {...content}
        >
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
    </>
  );
}
