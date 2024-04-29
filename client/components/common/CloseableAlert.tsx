import { Alert, AlertProps, useDisclosure, UseDisclosureProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CloseButton } from "./CloseButton";

export interface CloseableAlertProps extends AlertProps, Omit<UseDisclosureProps, "id"> {}

export const CloseableAlert = chakraForwardRef<"div", CloseableAlertProps>(function CloseableAlert(
  { isOpen, defaultIsOpen = true, onClose, onOpen, children, ...props },
  ref,
) {
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
        onClick={disclosure.onClose}
        sx={{
          _hover: {
            backgroundColor: "blackAlpha.100",
          },
          _active: {
            backgroundColor: "blackAlpha.200",
          },
        }}
        color="inherit"
        size="sm"
      />
    </Alert>
  ) : null;
});
