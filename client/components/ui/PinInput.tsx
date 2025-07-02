/* eslint-disable no-restricted-imports */
import {
  PinInput as ChakraPinInput,
  PinInputField,
  PinInputFieldProps,
  PinInputProps,
} from "@chakra-ui/react";
import { forwardRef, ReactNode } from "react";

// Docs: https://chakra-ui.com/docs/components/pin-input

// Root component - v3 API only
interface PinInputRootProps extends Omit<PinInputProps, "value" | "defaultValue" | "onChange"> {
  invalid?: boolean;
  disabled?: boolean;
  colorPalette?: string;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (details: { value: string[] }) => void;
  children: ReactNode;
}

export const PinInputRoot = forwardRef<HTMLDivElement, PinInputRootProps>(
  (
    { invalid, disabled, colorPalette, value, defaultValue, onValueChange, children, ...props },
    ref,
  ) => {
    // Map v3 props to v2 props
    const v2Props = {
      ...props,
      isInvalid: invalid,
      isDisabled: disabled,
      colorScheme: colorPalette,
      // Convert string[] to string for v2
      value: value ? value.join("") : undefined,
      defaultValue: defaultValue ? defaultValue.join("") : undefined,
      onChange: onValueChange
        ? (stringValue: string) => {
            // Convert string to string[] for v3
            const arrayValue = stringValue.split("");
            onValueChange({ value: arrayValue });
          }
        : undefined,
    };

    return <ChakraPinInput {...v2Props}>{children}</ChakraPinInput>;
  },
);

// Control component - wrapper for the input group
interface PinInputControlProps {
  children?: ReactNode;
  [key: string]: any;
}

export const PinInputControl = forwardRef<HTMLDivElement, PinInputControlProps>((props, ref) => {
  // In v2 compatibility mode, this is just a passthrough wrapper
  return <div ref={ref} {...props} />;
});

// Label component - for labeling the pin input
interface PinInputLabelProps {
  children?: ReactNode;
  [key: string]: any;
}

export const PinInputLabel = forwardRef<HTMLLabelElement, PinInputLabelProps>((props, ref) => {
  return <label ref={ref} {...props} />;
});

// Input component - maps to PinInputField
export const PinInputInput = forwardRef<HTMLInputElement, PinInputFieldProps>((props, ref) => {
  return <PinInputField ref={ref} {...props} />;
});

// v3 PinInput namespace
export const PinInput = {
  Root: PinInputRoot,
  Control: PinInputControl,
  Label: PinInputLabel,
  Input: PinInputInput,
};

// Assign display names for debugging
PinInputRoot.displayName = "PinInput.Root";
PinInputControl.displayName = "PinInput.Control";
PinInputLabel.displayName = "PinInput.Label";
PinInputInput.displayName = "PinInput.Input";
