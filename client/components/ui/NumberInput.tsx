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
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/number-input

// Root component - v3 API only
interface NumberInputRootProps extends Omit<NumberInputProps, "onChange"> {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onValueChange?: (details: { value: string; valueAsNumber: number }) => void;
}

export const NumberInputRoot = forwardRef<HTMLDivElement, NumberInputRootProps>(
  ({ invalid, disabled, readOnly, onValueChange, ...props }, ref) => {
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
  },
);

// Input component - maps to NumberInputField
export const NumberInputInput = forwardRef<HTMLInputElement, NumberInputFieldProps>(
  (props, ref) => {
    return <NumberInputField ref={ref} {...props} />;
  },
);

// Control component - maps to NumberInputStepper (v3: NumberInput.Control)
export const NumberInputControl = forwardRef<HTMLDivElement, NumberInputStepperProps>(
  (props, ref) => {
    return <NumberInputStepper ref={ref} {...props} />;
  },
);

// IncrementTrigger component - maps to NumberIncrementStepper
export const NumberInputIncrementTrigger = forwardRef<
  HTMLButtonElement,
  NumberIncrementStepperProps
>((props, ref) => {
  return <NumberIncrementStepper ref={ref} {...props} />;
});

// DecrementTrigger component - maps to NumberDecrementStepper
export const NumberInputDecrementTrigger = forwardRef<
  HTMLButtonElement,
  NumberDecrementStepperProps
>((props, ref) => {
  return <NumberDecrementStepper ref={ref} {...props} />;
});

// v3 NumberInput namespace
export const NumberInput = {
  Root: NumberInputRoot,
  Input: NumberInputInput,
  Control: NumberInputControl,
  IncrementTrigger: NumberInputIncrementTrigger,
  DecrementTrigger: NumberInputDecrementTrigger,
};

// Assign display names for debugging
NumberInputRoot.displayName = "NumberInput.Root";
NumberInputInput.displayName = "NumberInput.Input";
NumberInputControl.displayName = "NumberInput.Control";
NumberInputIncrementTrigger.displayName = "NumberInput.IncrementTrigger";
NumberInputDecrementTrigger.displayName = "NumberInput.DecrementTrigger";
