import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@chakra-ui/react";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import { ReactNode, useEffect } from "react";
import { BaseDialog } from "./BaseDialog";

export type BlockingDialogProps = {
  header: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
  task: Promise<any>;
};

export function BlockingDialog({
  header,
  body,
  footer,
  task,
  ...props
}: DialogProps<BlockingDialogProps>) {
  useEffect(() => {
    task.then(() => props.onResolve());
  }, []);
  return (
    <BaseDialog closeOnEsc={false} closeOnOverlayClick={false} {...props}>
      <ModalContent>
        <ModalHeader>{header}</ModalHeader>
        <ModalBody {...(footer ? {} : { paddingBottom: 4 })}>{body}</ModalBody>
        {footer ? <ModalFooter>{footer}</ModalFooter> : null}
      </ModalContent>
    </BaseDialog>
  );
}

export function useBlockingDialog() {
  return useDialog(BlockingDialog);
}
