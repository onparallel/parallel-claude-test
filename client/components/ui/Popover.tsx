import {
  // eslint-disable-next-line no-restricted-imports
  Popover as ChakraPopover,
  PopoverAnchor,
  PopoverArrow,
  PopoverArrowProps,
  PopoverBody,
  PopoverBodyProps,
  PopoverCloseButton,
  PopoverCloseButtonProps,
  PopoverContent,
  PopoverContentProps,
  PopoverFooter,
  PopoverFooterProps,
  PopoverHeader,
  PopoverHeaderProps,
  PopoverProps,
  PopoverTrigger,
} from "@chakra-ui/react";
import { ReactNode, forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/popover

// v3 API only - no v2 compatibility
export interface ExtendedPopoverProps extends Omit<PopoverProps, "isOpen" | "isLazy" | "children"> {
  open?: boolean;
  lazy?: boolean;
  children: ReactNode;
}

// Apply default props from components.tsx
export const PopoverRoot = ({
  open,
  lazy = true,
  openDelay = 250,
  strategy = "fixed",
  ...props
}: ExtendedPopoverProps) => {
  return (
    <ChakraPopover
      isOpen={open}
      isLazy={lazy}
      openDelay={openDelay}
      strategy={strategy}
      {...props}
    />
  );
};

// Popover.Trigger component
export const PopoverTriggerWrapper = ({ children }: { children: ReactNode }) => {
  return <PopoverTrigger>{children}</PopoverTrigger>;
};

// Popover.Content component
export const PopoverContentWrapper = forwardRef<HTMLElement, PopoverContentProps>((props, ref) => {
  return <PopoverContent ref={ref} {...props} />;
});

// Popover.Header component
export const PopoverHeaderWrapper = forwardRef<HTMLElement, PopoverHeaderProps>((props, ref) => {
  return <PopoverHeader ref={ref} {...props} />;
});

// Popover.Body component
export const PopoverBodyWrapper = forwardRef<HTMLElement, PopoverBodyProps>((props, ref) => {
  return <PopoverBody ref={ref} {...props} />;
});

// Popover.Footer component
export const PopoverFooterWrapper = (props: PopoverFooterProps) => {
  return <PopoverFooter {...props} />;
};

// Popover.CloseButton component
export const PopoverCloseButtonWrapper = forwardRef<HTMLElement, PopoverCloseButtonProps>(
  (props, ref) => {
    return <PopoverCloseButton ref={ref} {...props} />;
  },
);

// Popover.Arrow component
export const PopoverArrowWrapper = (props: PopoverArrowProps) => {
  return <PopoverArrow {...props} />;
};

// Popover.Anchor component
export const PopoverAnchorWrapper = ({ children }: { children: ReactNode }) => {
  return <PopoverAnchor>{children}</PopoverAnchor>;
};

// Namespace to use as Popover.XXX
export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTriggerWrapper,
  Content: PopoverContentWrapper,
  Header: PopoverHeaderWrapper,
  Body: PopoverBodyWrapper,
  Footer: PopoverFooterWrapper,
  CloseButton: PopoverCloseButtonWrapper,
  Arrow: PopoverArrowWrapper,
  Anchor: PopoverAnchorWrapper,
};

// Assign display names for debugging
PopoverRoot.displayName = "Popover.Root";
PopoverTriggerWrapper.displayName = "Popover.Trigger";
PopoverContentWrapper.displayName = "Popover.Content";
PopoverHeaderWrapper.displayName = "Popover.Header";
PopoverBodyWrapper.displayName = "Popover.Body";
PopoverFooterWrapper.displayName = "Popover.Footer";
PopoverCloseButtonWrapper.displayName = "Popover.CloseButton";
PopoverArrowWrapper.displayName = "Popover.Arrow";
PopoverAnchorWrapper.displayName = "Popover.Anchor";
