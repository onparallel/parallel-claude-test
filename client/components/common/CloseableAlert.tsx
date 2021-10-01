import {
  Alert,
  AlertProps,
  CloseButton,
  useDisclosure,
  UseDisclosureProps,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";

export interface CloseableAlertProps extends AlertProps, Omit<UseDisclosureProps, "id"> {}

export const CloseableAlert = chakraForwardRef<"div", CloseableAlertProps>(function CloseableAlert(
  { isOpen, defaultIsOpen = true, onClose, onOpen, children, ...props },
  ref
) {
  const intl = useIntl();
  const disclosure = useDisclosure({
    isOpen,
    defaultIsOpen,
    onClose,
    onOpen,
  });
  return disclosure.isOpen ? (
    <Alert ref={ref} {...props}>
      {children}
      <CloseButton
        aria-label={intl.formatMessage({ id: "generic.close", defaultMessage: "Close" })}
        onClick={disclosure.onClose}
      />
    </Alert>
  ) : null;
});
