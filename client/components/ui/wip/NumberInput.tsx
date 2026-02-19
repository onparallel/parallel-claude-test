import {
  NumberInput as ChakraNumberInput,
  NumberDecrementStepper,
  NumberDecrementStepperProps,
  NumberIncrementStepper,
  NumberIncrementStepperProps,
  NumberInputField,
  NumberInputFieldProps,
  NumberInputProps,
  NumberInputStepper,
  NumberInputStepperProps,
} from "@chakra-ui/react";
import { RefAttributes } from "react";

// Docs: https://chakra-ui.com/docs/components/number-input

// Root component - v3 API only
interface NumberInputRootProps extends Omit<NumberInputProps, "onChange"> {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onValueChange?: (details: { value: string; valueAsNumber: number }) => void;
}

export function NumberInputRoot({
  invalid,
  disabled,
  readOnly,
  onValueChange,
  ref,
  ...props
}: NumberInputRootProps & RefAttributes<HTMLDivElement>) {
  // Map v3 props to v2 props
  const v2Props = {
    ...props,
    isInvalid: invalid,
    isDisabled: disabled,
    isReadOnly: readOnly,
    onChange: onValueChange
      ? (value: string, valueAsNumber: number) => {
          onValueChange({ value, valueAsNumber });
        }
      : undefined,
  };

  return <ChakraNumberInput ref={ref} {...v2Props} />;
}

// Input component - maps to NumberInputField
export function NumberInputInput({
  ref,
  ...props
}: NumberInputFieldProps & RefAttributes<HTMLInputElement>) {
  return <NumberInputField ref={ref} {...props} />;
}

// Control component - maps to NumberInputStepper (v3: NumberInput.Control)
export function NumberInputControl({
  ref,
  ...props
}: NumberInputStepperProps & RefAttributes<HTMLDivElement>) {
  return <NumberInputStepper ref={ref} {...props} />;
}

// IncrementTrigger component - maps to NumberIncrementStepper
export function NumberInputIncrementTrigger({
  ref,
  ...props
}: NumberIncrementStepperProps & RefAttributes<HTMLButtonElement>) {
  return <NumberIncrementStepper ref={ref} {...props} />;
}

// DecrementTrigger component - maps to NumberDecrementStepper
export function NumberInputDecrementTrigger({
  ref,
  ...props
}: NumberDecrementStepperProps & RefAttributes<HTMLButtonElement>) {
  return <NumberDecrementStepper ref={ref} {...props} />;
}

// v3 NumberInput namespace
export const NumberInput = {
  Root: NumberInputRoot,
  Input: NumberInputInput,
  Control: NumberInputControl,
  IncrementTrigger: NumberInputIncrementTrigger,
  DecrementTrigger: NumberInputDecrementTrigger,
};
