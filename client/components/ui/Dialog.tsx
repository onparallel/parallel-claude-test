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
import { forwardRef, ReactNode } from "react";

// Docs: https://chakra-ui.com/docs/components/dialog

// Root component - v3 Dialog API only
interface DialogRootProps extends Omit<ModalProps, "isOpen" | "onClose" | "children"> {
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
  placement?: "center" | "top" | "bottom";
  children: ReactNode;
}

export const DialogRoot = forwardRef<HTMLDivElement, DialogRootProps>(
  ({ open, onOpenChange, placement, children, ...props }, ref) => {
    // Map v3 props to v2 props
    const v2Props = {
      ...props,
      isOpen: open || false,
      onClose: onOpenChange ? () => onOpenChange({ open: false }) : () => {},
      isCentered: placement === "center",
    };

    return <ChakraModal {...v2Props}>{children}</ChakraModal>;
  },
);

// Dialog.Backdrop component - maps to ModalOverlay
export const DialogBackdrop = forwardRef<HTMLDivElement, ModalOverlayProps>((props, ref) => {
  return <ModalOverlay ref={ref} {...props} />;
});

// Dialog.Positioner component - maps to ModalContent
export const DialogPositioner = forwardRef<HTMLDivElement, ModalContentProps>((props, ref) => {
  return <ModalContent ref={ref} {...props} />;
});

// Dialog.Content component - wrapper for content
interface DialogContentProps {
  children?: ReactNode;
  [key: string]: any;
}

export const DialogContentWrapper = forwardRef<HTMLDivElement, DialogContentProps>((props, ref) => {
  // In v2, ModalContent handles the content container
  // In v3, Dialog.Content would be a separate layer
  return <div ref={ref} {...props} />;
});

// Dialog.Title component - maps to ModalHeader
export const DialogTitle = forwardRef<HTMLDivElement, ModalHeaderProps>((props, ref) => {
  return <ModalHeader ref={ref} {...props} />;
});

// Dialog.Description component - maps to ModalBody
export const DialogDescription = forwardRef<HTMLDivElement, ModalBodyProps>((props, ref) => {
  return <ModalBody ref={ref} {...props} />;
});

// Dialog.Footer component - maps to ModalFooter
export const DialogFooter = forwardRef<HTMLDivElement, ModalFooterProps>((props, ref) => {
  return <ModalFooter ref={ref} {...props} />;
});

// Dialog.CloseTrigger component - maps to ModalCloseButton
export const DialogCloseTrigger = forwardRef<HTMLButtonElement, ModalCloseButtonProps>(
  (props, ref) => {
    return <ModalCloseButton ref={ref} {...props} />;
  },
);

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

// Assign display names for debugging
DialogRoot.displayName = "Dialog.Root";
DialogBackdrop.displayName = "Dialog.Backdrop";
DialogPositioner.displayName = "Dialog.Positioner";
DialogContentWrapper.displayName = "Dialog.Content";
DialogTitle.displayName = "Dialog.Title";
DialogDescription.displayName = "Dialog.Description";
DialogFooter.displayName = "Dialog.Footer";
DialogCloseTrigger.displayName = "Dialog.CloseTrigger";
