import { Checkbox as ChakraCheckbox, CheckboxProps } from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/checkbox

// v3 API only - no v2 compatibility
export interface ExtendedCheckboxProps
  extends Omit<
    CheckboxProps,
    "isInvalid" | "isDisabled" | "isReadOnly" | "isChecked" | "colorScheme"
  > {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  checked?: boolean;
  colorPalette?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, ExtendedCheckboxProps>(
  ({ invalid, disabled, readOnly, checked, colorPalette, ...props }, ref) => {
    return (
      <ChakraCheckbox
        ref={ref}
        isInvalid={invalid}
        isDisabled={disabled}
        isReadOnly={readOnly}
        isChecked={checked}
        colorScheme={colorPalette}
        {...props}
      />
    );
  },
);

Checkbox.displayName = "Checkbox";
