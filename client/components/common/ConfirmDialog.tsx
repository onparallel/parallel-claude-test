import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  ButtonProps
} from "@chakra-ui/core";
import { useRef, ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export type ConfirmDialogProps = {
  header: ReactNode;
  body: ReactNode;
  confirm: ReactNode;
  cancel?: ReactNode;
  confirmButtonProps?: Omit<ButtonProps, "children">;
  cancelButtonProps?: Omit<ButtonProps, "children">;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  header,
  body,
  confirm,
  cancel,
  confirmButtonProps,
  cancelButtonProps,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLElement>(null);
  return (
    <AlertDialog
      isOpen={true}
      leastDestructiveRef={cancelRef}
      onClose={onConfirm}
    >
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogHeader fontSize="lg" fontWeight="bold">
          {header}
        </AlertDialogHeader>
        <AlertDialogBody>{body}</AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={cancelRef} onClick={onCancel} {...cancelButtonProps}>
            {cancel ?? (
              <FormattedMessage
                id="component.confirm-dialog.cancel-button"
                defaultMessage="Cancel"
              />
            )}
          </Button>
          <Button onClick={onConfirm} marginLeft={2} {...confirmButtonProps}>
            {confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
