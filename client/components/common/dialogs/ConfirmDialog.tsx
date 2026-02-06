import {
  Flex,
  HTMLChakraProps,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalContentProps,
  ModalFooter,
  ModalHeader,
  Stack,
} from "@chakra-ui/react";
import { Button } from "@parallel/components/ui";
import { MaybeFunction, unMaybeFunction } from "@parallel/utils/types";
import { useUpdatingMemoRef } from "@parallel/utils/useUpdatingRef";
import { ReactNode, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ScrollShadows } from "../ScrollShadows";
import { BaseDialog, BaseDialogProps } from "./DialogProvider";

export interface ConfirmDialogProps<TResult> extends Omit<BaseDialogProps<TResult>, "children"> {
  header: ReactNode;
  body: ReactNode;
  confirm: ReactNode;
  cancel?: ReactNode;
  alternative?: ReactNode;
  content?: ModalContentProps;
  hasCloseButton?: boolean;
  bodyProps?: MaybeFunction<HTMLChakraProps<"div">>;
}

export function ConfirmDialog<TResult = void>({
  header,
  body,
  bodyProps,
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
    [],
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
        <ModalBody
          as={props.scrollBehavior === "inside" ? ScrollShadows : undefined}
          {...unMaybeFunction(bodyProps)}
        >
          {body}
        </ModalBody>
        <ModalFooter
          as={Stack}
          direction={{ base: "column", sm: "row" }}
          alignItems={{ base: "stretch" }}
        >
          {alternative ? (
            <Flex flex="1" direction="column" alignItems={{ base: "stretch", sm: "flex-start" }}>
              {alternative}
            </Flex>
          ) : null}
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
