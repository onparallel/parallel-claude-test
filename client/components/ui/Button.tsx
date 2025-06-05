import { ButtonProps, Button as ChakraButton } from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/button

// v3 API only - no v2 compatibility
export interface ExtendedButtonProps
  extends Omit<ButtonProps, "colorScheme" | "isDisabled" | "isLoading"> {
  colorPalette?: string;
  disabled?: boolean;
  loading?: boolean;
  "data-active"?: boolean; // v3 uses data-active instead of isActive
}

export const Button = forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ colorPalette, disabled, loading, "data-active": dataActive, ...props }, ref) => {
    return (
      <ChakraButton
        ref={ref}
        colorScheme={colorPalette}
        isDisabled={disabled}
        isLoading={loading}
        data-active={dataActive}
        cursor="pointer" // Ensure pointer cursor for v3
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
