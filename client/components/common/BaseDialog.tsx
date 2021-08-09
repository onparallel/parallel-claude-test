import { Modal, ModalOverlay, ModalProps } from "@chakra-ui/react";
import { ReactNode } from "react";
import { DialogProps } from "./DialogProvider";

export interface BaseDialogProps<TResult>
  extends Omit<ModalProps, "children" | "isOpen" | "onClose">,
    DialogProps<{}, TResult> {
  children: ReactNode;
}

export function BaseDialog<TResult = void>({
  onResolve,
  onReject,
  children,
  ...props
}: BaseDialogProps<TResult>) {
  return (
    <Modal isOpen={true} onClose={() => onReject({ reason: "CLOSE" })} {...props}>
      <ModalOverlay>{children}</ModalOverlay>
    </Modal>
  );
}
