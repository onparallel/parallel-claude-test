import { Input as ChakraInput, InputProps } from "@chakra-ui/react";
import { forwardRef } from "react";

// Docs: https://chakra-ui.com/docs/components/input

// v3 API only - no v2 compatibility
export interface ExtendedInputProps
  extends Omit<InputProps, "isInvalid" | "isDisabled" | "isReadOnly"> {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export const Input = forwardRef<HTMLInputElement, ExtendedInputProps>(
  ({ invalid, disabled, readOnly, ...props }, ref) => {
    return (
      <ChakraInput
        ref={ref}
        isInvalid={invalid}
        isDisabled={disabled}
        isReadOnly={readOnly}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
