import { Switch as ChakraSwitch, SwitchProps } from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/switch

// v3 API only - no v2 compatibility
export interface ExtendedSwitchProps
  extends Omit<SwitchProps, "isDisabled" | "isChecked" | "colorScheme"> {
  disabled?: boolean;
  checked?: boolean;
  colorPalette?: string;
}

export const Switch = forwardRef<HTMLInputElement, ExtendedSwitchProps>(
  ({ disabled, checked, colorPalette, ...props }, ref) => {
    return (
      <ChakraSwitch
        ref={ref}
        isDisabled={disabled}
        isChecked={checked}
        colorScheme={colorPalette}
        {...props}
      />
    );
  },
);

Switch.displayName = "Switch";
