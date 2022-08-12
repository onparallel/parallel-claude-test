import {
  Button,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalContentProps,
  ModalFooter,
  ModalHeader,
  Stack,
} from "@chakra-ui/react";
import { useUpdatingMemoRef } from "@parallel/utils/useUpdatingRef";
import { ReactNode, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BaseDialog, BaseDialogProps } from "./BaseDialog";

export interface ConfirmDialogProps<TResult> extends Omit<BaseDialogProps<TResult>, "children"> {
  header: ReactNode;
  body: ReactNode;
  confirm: ReactNode;
  cancel?: ReactNode;
  alternative?: ReactNode;
  content?: ModalContentProps;
  hasCloseButton?: boolean;
}

export function ConfirmDialog<TResult = void>({
  header,
  body,
  confirm,
  cancel,
  alternative,
  content,
  initialFocusRef,
  hasCloseButton,
  ...props
}: ConfirmDialogProps<TResult>) {
  const intl = useIntl();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const focusRef = useUpdatingMemoRef(
    () => ({
      focus() {
        setTimeout(() => {
          try {
            (initialFocusRef ?? cancelRef).current?.focus();
          } catch {}
        });
      },
    }),
    []
  );
  return (
    <BaseDialog initialFocusRef={focusRef} {...props}>
      <ModalContent {...content}>
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
          {alternative}
          {cancel ?? (
            <Button ref={cancelRef} onClick={() => props.onReject("CANCEL")}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          )}
          {confirm}
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}
