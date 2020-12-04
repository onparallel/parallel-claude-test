import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Stack,
} from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { ReactNode, RefObject, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { DialogProps } from "./DialogProvider";

export type ConfirmDialogProps<TResult> = {
  header: ReactNode;
  body: ReactNode;
  confirm: ReactNode;
  cancel?: ReactNode;
  initialFocusRef?: RefObject<any>;
  content?: ExtendChakra;
  hasCloseButton?: boolean;
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
  hasCloseButton,
  ...props
}: ConfirmDialogProps<TResult>) {
  const intl = useIntl();
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
          {hasCloseButton ? (
            <ModalCloseButton
              aria-label={intl.formatMessage({
                id: "generic.close",
                defaultMessage: "Close",
              })}
            />
          ) : null}
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
