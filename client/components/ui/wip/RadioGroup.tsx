import {
  // eslint-disable-next-line no-restricted-imports
  Radio as ChakraRadio,
  // eslint-disable-next-line no-restricted-imports
  RadioGroup as ChakraRadioGroup,
  RadioGroupProps,
  RadioProps,
} from "@chakra-ui/react";
import { ReactNode, RefAttributes } from "react";

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
export function RadioSingle({
  invalid,
  disabled,
  readOnly,
  checked,
  colorPalette,
  ref,
  ...props
}: ExtendedRadioProps & RefAttributes<HTMLInputElement>) {
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
}

// RadioGroup.Root component for v3 compatibility
export function RadioGroupRoot({
  invalid,
  disabled,
  readOnly,
  colorPalette,
  ref,
  ...props
}: ExtendedRadioGroupProps & RefAttributes<HTMLDivElement>) {
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
}

// RadioGroup.Item component - wraps individual Radio
export function RadioGroupItem({
  invalid,
  disabled,
  readOnly,
  checked,
  colorPalette,
  ref,
  ...props
}: ExtendedRadioProps & RefAttributes<HTMLInputElement>) {
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
}

// For v3, these would be separate components, but for v2 compatibility
// we'll make them aliases to the standard Radio
export const RadioGroupItemHiddenInput = () => null; // Not needed in v2
export const RadioGroupItemIndicator = () => null; // Not needed in v2
export const RadioGroupItemText = ({
  children,
  ...props
}: {
  children: ReactNode;
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
