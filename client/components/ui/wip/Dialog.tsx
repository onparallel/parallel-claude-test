import {
  Modal as ChakraModal,
  ModalBody,
  ModalBodyProps,
  ModalCloseButton,
  ModalCloseButtonProps,
  ModalContent,
  ModalContentProps,
  ModalFooter,
  ModalFooterProps,
  ModalHeader,
  ModalHeaderProps,
  ModalOverlay,
  ModalOverlayProps,
  ModalProps,
} from "@chakra-ui/react";
import { ReactNode, RefAttributes } from "react";

// Docs: https://chakra-ui.com/docs/components/dialog

// Root component - v3 Dialog API only
interface DialogRootProps extends Omit<ModalProps, "isOpen" | "onClose" | "children"> {
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
  placement?: "center" | "top" | "bottom";
  children: ReactNode;
}

export function DialogRoot({ open, onOpenChange, placement, children, ...props }: DialogRootProps) {
  // Map v3 props to v2 props
  const v2Props = {
    ...props,
    isOpen: open || false,
    onClose: onOpenChange ? () => onOpenChange({ open: false }) : () => {},
    isCentered: placement === "center",
  };

  return <ChakraModal {...v2Props}>{children}</ChakraModal>;
}

// Dialog.Backdrop component - maps to ModalOverlay
export function DialogBackdrop({
  ref,
  ...props
}: ModalOverlayProps & RefAttributes<HTMLDivElement>) {
  return <ModalOverlay ref={ref} {...props} />;
}

// Dialog.Positioner component - maps to ModalContent
export function DialogPositioner({
  ref,
  ...props
}: ModalContentProps & RefAttributes<HTMLDivElement>) {
  return <ModalContent ref={ref} {...props} />;
}

// Dialog.Content component - wrapper for content
interface DialogContentProps {
  children?: ReactNode;
  [key: string]: any;
}

export function DialogContentWrapper({
  ref,
  ...props
}: DialogContentProps & RefAttributes<HTMLDivElement>) {
  // In v2, ModalContent handles the content container
  // In v3, Dialog.Content would be a separate layer
  return <div ref={ref} {...props} />;
}

// Dialog.Title component - maps to ModalHeader
export function DialogTitle({ ref, ...props }: ModalHeaderProps & RefAttributes<HTMLDivElement>) {
  return <ModalHeader ref={ref} {...props} />;
}

// Dialog.Description component - maps to ModalBody
export function DialogDescription({
  ref,
  ...props
}: ModalBodyProps & RefAttributes<HTMLDivElement>) {
  return <ModalBody ref={ref} {...props} />;
}

// Dialog.Footer component - maps to ModalFooter
export function DialogFooter({ ref, ...props }: ModalFooterProps & RefAttributes<HTMLDivElement>) {
  return <ModalFooter ref={ref} {...props} />;
}

// Dialog.CloseTrigger component - maps to ModalCloseButton
export function DialogCloseTrigger({
  ref,
  ...props
}: ModalCloseButtonProps & RefAttributes<HTMLButtonElement>) {
  return <ModalCloseButton ref={ref} {...props} />;
}

// v3 Dialog namespace
export const Dialog = {
  Root: DialogRoot,
  Backdrop: DialogBackdrop,
  Positioner: DialogPositioner,
  Content: DialogContentWrapper,
  Title: DialogTitle,
  Description: DialogDescription,
  Footer: DialogFooter,
  CloseTrigger: DialogCloseTrigger,
};
