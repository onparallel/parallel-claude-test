import { Alert, AlertProps, CloseButton, useDisclosure } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";

export const CloseableAlert = chakraForwardRef<"div", AlertProps>(function CloseableAlert(
  { children, ...props },
  ref
) {
  const intl = useIntl();
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  return isOpen ? (
    <Alert ref={ref} {...props}>
      {children}
      <CloseButton
        aria-label={intl.formatMessage({ id: "generic.close", defaultMessage: "Close" })}
        onClick={onClose}
      />
    </Alert>
  ) : null;
});
