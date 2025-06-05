// eslint-disable-next-line no-restricted-imports
import { Collapse as ChakraCollapse, CollapseProps } from "@chakra-ui/react";
import { forwardRef, ReactNode } from "react";

// Docs: https://chakra-ui.com/docs/components/collapsible

// Root component - v3 Collapsible API only
export interface CollapsibleRootProps extends Omit<CollapseProps, "in" | "children"> {
  open?: boolean;
  onOpenChange?: (details: { open: boolean }) => void;
  children: ReactNode;
}

export const CollapsibleRoot = forwardRef<HTMLDivElement, CollapsibleRootProps>(
  ({ open, onOpenChange, children, animateOpacity, ...props }, ref) => {
    if (animateOpacity) {
      console.warn(
        "Collapsible: animateOpacity is not supported in v3, use keyframes animations instead",
      );
    }

    return (
      <ChakraCollapse ref={ref} in={open} {...props}>
        {children}
      </ChakraCollapse>
    );
  },
);

// Content component - in v3 this wraps the collapsible content
interface CollapsibleContentProps {
  children?: ReactNode;
  [key: string]: any;
}

export const CollapsibleContent = forwardRef<HTMLDivElement, CollapsibleContentProps>(
  (props, ref) => {
    // In v2 compatibility mode, this is just a passthrough
    // The actual collapse behavior is handled by CollapsibleRoot
    return <div ref={ref} {...props} />;
  },
);

// v3 Collapsible namespace
export const Collapsible = {
  Root: CollapsibleRoot,
  Content: CollapsibleContent,
};

// Assign display names for debugging
CollapsibleRoot.displayName = "Collapsible.Root";
CollapsibleContent.displayName = "Collapsible.Content";
