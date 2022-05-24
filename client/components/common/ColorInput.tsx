import { Box, Input, InputProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";

interface ColorInputProps extends Omit<InputProps, "value" | "onChange"> {
  value: string;
  onChange?: (value: string) => any;
}

export const ColorInput = chakraForwardRef<"input", ColorInputProps, HTMLInputElement>(
  function ColorInput({ value, onChange, ...props }, ref) {
    return (
      <Box>
        <Input
          position="absolute"
          ref={ref}
          type="color"
          opacity={0}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />
        <Box backgroundColor={value} boxSize={props.boxSize} borderRadius={props.borderRadius} />
      </Box>
    );
  }
);
