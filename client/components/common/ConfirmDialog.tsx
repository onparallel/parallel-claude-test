import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Stack,
} from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { ReactNode, RefObject, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { DialogProps } from "./DialogOpenerProvider";

export type ConfirmDialogProps<TResult> = {
  header: ReactNode;
  body: ReactNode;
  confirm: ReactNode;
  cancel?: ReactNode;
  initialFocusRef?: RefObject<any>;
  content?: ExtendChakra;
} & DialogProps<{}, TResult> &
  Omit<ModalProps, "children" | "isOpen" | "initialFocusRef" | "onClose">;

export function ConfirmDialog<TResult = void>({
  header,
  body,
  confirm,
  cancel,
  initialFocusRef,
  onResolve,
  onReject,
  content,
  ...props
}: ConfirmDialogProps<TResult>) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      isOpen={true}
      initialFocusRef={initialFocusRef ?? cancelRef}
      onClose={() => onReject({ reason: "CLOSE" })}
      {...props}
    >
      <ModalOverlay>
        <ModalContent borderRadius="md" {...content}>
          <ModalHeader>{header}</ModalHeader>
          <ModalBody>{body}</ModalBody>
          <ModalFooter as={Stack} direction="row">
            {cancel ?? (
              <Button
                ref={cancelRef}
                onClick={() => onReject({ reason: "CANCEL" })}
              >
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
            )}
            {confirm}
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}
