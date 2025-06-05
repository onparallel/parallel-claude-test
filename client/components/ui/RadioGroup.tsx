import {
  // eslint-disable-next-line no-restricted-imports
  Radio as ChakraRadio,
  // eslint-disable-next-line no-restricted-imports
  RadioGroup as ChakraRadioGroup,
  RadioGroupProps,
  RadioProps,
} from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/radio

// v3 API only - no v2 compatibility
export interface ExtendedRadioProps
  extends Omit<
    RadioProps,
    "isInvalid" | "isDisabled" | "isReadOnly" | "isChecked" | "colorScheme"
  > {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  checked?: boolean;
  colorPalette?: string;
}

export interface ExtendedRadioGroupProps
  extends Omit<RadioGroupProps, "isInvalid" | "isDisabled" | "isReadOnly" | "colorScheme"> {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  colorPalette?: string;
}

// Single Radio component
export const RadioSingle = forwardRef<HTMLInputElement, ExtendedRadioProps>(
  ({ invalid, disabled, readOnly, checked, colorPalette, ...props }, ref) => {
    return (
      <ChakraRadio
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

// RadioGroup.Root component for v3 compatibility
export const RadioGroupRoot = forwardRef<HTMLDivElement, ExtendedRadioGroupProps>(
  ({ invalid, disabled, readOnly, colorPalette, ...props }, ref) => {
    return (
      <ChakraRadioGroup
        ref={ref}
        isInvalid={invalid}
        isDisabled={disabled}
        isReadOnly={readOnly}
        colorScheme={colorPalette}
        {...props}
      />
    );
  },
);

// RadioGroup.Item component - wraps individual Radio
export const RadioGroupItem = forwardRef<HTMLInputElement, ExtendedRadioProps>(
  ({ invalid, disabled, readOnly, checked, colorPalette, ...props }, ref) => {
    return (
      <ChakraRadio
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

// For v3, these would be separate components, but for v2 compatibility
// we'll make them aliases to the standard Radio
export const RadioGroupItemHiddenInput = () => null; // Not needed in v2
export const RadioGroupItemIndicator = () => null; // Not needed in v2
export const RadioGroupItemText = ({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => <span {...props}>{children}</span>;

// Namespace pattern for v3 compatibility
export const RadioGroup = {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  ItemHiddenInput: RadioGroupItemHiddenInput,
  ItemIndicator: RadioGroupItemIndicator,
  ItemText: RadioGroupItemText,
};

// Default Radio export
export const Radio = RadioSingle;

// Display names
RadioSingle.displayName = "Radio";
RadioGroupRoot.displayName = "RadioGroup.Root";
RadioGroupItem.displayName = "RadioGroup.Item";
RadioGroupItemHiddenInput.displayName = "RadioGroup.ItemHiddenInput";
RadioGroupItemIndicator.displayName = "RadioGroup.ItemIndicator";
RadioGroupItemText.displayName = "RadioGroup.ItemText";
