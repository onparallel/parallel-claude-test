import { Box, Input, InputProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";

interface ColorInputProps extends Omit<InputProps, "value" | "onChange"> {
  value: string;
  onChange?: (value: string) => any;
}

export const ColorInput = chakraForwardRef<"input", ColorInputProps, HTMLInputElement>(
  function ColorInput({ value, onChange, ...props }, ref) {
    const handleChange = onChange ? useDebouncedCallback(onChange, 100, []) : undefined;
    return (
      <Box>
        <Input
          position="absolute"
          ref={ref}
          type="color"
          opacity={0}
          value={value}
          onChange={(e) => handleChange?.(e.target.value)}
          {...props}
        />
        <Box backgroundColor={value} boxSize={props.boxSize} borderRadius={props.borderRadius} />
      </Box>
    );
  }
);
