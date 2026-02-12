import {
  // eslint-disable-next-line no-restricted-imports
  Tooltip as ChakraTooltip,
  TooltipProps,
} from "@chakra-ui/react";
import { RefAttributes } from "react";

// Docs: https://chakra-ui.com/docs/components/tooltip

// v3 API only - no v2 compatibility
export interface ExtendedTooltipProps extends Omit<TooltipProps, "isOpen" | "isDisabled"> {
  open?: boolean;
  disabled?: boolean;
}

// Apply default props from components.tsx
export function Tooltip({
  open,
  disabled,
  hasArrow = true,
  openDelay = 250,
  closeDelay = 150,
  arrowSize = 8,
  borderRadius = 4,
  ref,
  ...props
}: ExtendedTooltipProps & RefAttributes<HTMLElement>) {
  return (
    <ChakraTooltip
      ref={ref}
      isOpen={open}
      isDisabled={disabled}
      hasArrow={hasArrow}
      openDelay={openDelay}
      closeDelay={closeDelay}
      arrowSize={arrowSize}
      borderRadius={borderRadius}
      {...props}
    />
  );
}
