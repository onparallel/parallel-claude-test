import { Box, Input, InputProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";

interface ColorInputProps extends Omit<InputProps, "value" | "onChange"> {
  value: string;
  onChange?: (value: string) => any;
}

export const ColorInput = chakraForwardRef<"input", ColorInputProps, HTMLInputElement>(
  function ColorInput({ value, onChange, ...props }) {
    const handleChange = onChange
      ? useDebouncedCallback(onChange, 100, [value, onChange])
      : undefined;
    return (
      <Box>
        <Input
          type="color"
          backgroundColor={value}
          value={value}
          onChange={(e) => handleChange?.(e.target.value)}
          {...props}
          sx={{
            "::-webkit-color-swatch": { opacity: 0 },
            "::-moz-color-swatch": { opacity: 0 },
          }}
        />
      </Box>
    );
  }
);
