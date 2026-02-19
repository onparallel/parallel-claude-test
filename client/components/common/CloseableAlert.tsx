import { Alert, AlertProps, useDisclosure, UseDisclosureProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { CloseButton } from "./CloseButton";

export interface CloseableAlertProps extends AlertProps, Omit<UseDisclosureProps, "id"> {}

export const CloseableAlert = chakraComponent<"div", CloseableAlertProps>(function CloseableAlert({
  ref,
  isOpen,
  defaultIsOpen = true,
  onClose,
  onOpen,
  children,
  ...props
}) {
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
