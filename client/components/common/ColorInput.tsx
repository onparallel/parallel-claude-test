import {
  chakra,
  FormControl,
  FormControlOptions,
  HStack,
  omitThemingProps,
  ThemingProps,
  useFormControl,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { cx } from "@chakra-ui/utils";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { IMaskInput } from "react-imask";
import { noop } from "remeda";

interface ColorInputProps extends ThemingProps<"Input">, FormControlOptions {
  value: string;
  onChange?: (value: string) => any;
}

export const ColorInput = chakraForwardRef<"input", ColorInputProps, HTMLInputElement>(
  function ColorInput({ value, onChange, ...props }, ref) {
    const handleChange = useDebouncedCallback(onChange ?? noop, 100, []);
    const styles = useMultiStyleConfig("Input", props);
    const ownProps = omitThemingProps(props);
    const _className = cx("chakra-input", props.className);
    const input = useFormControl<HTMLInputElement>(ownProps);
    return (
      <HStack alignItems="center">
        <chakra.input
          as={IMaskInput}
          {...input}
          __css={{ ...styles.field, minWidth: "102px" }}
          ref={ref}
          className={_className}
          {...({
            mask: "#AAAAAA",
            definitions: { A: /[0-9A-Fa-f]/ },
            onAccept: (value: string) => onChange?.(value),
          } as any)}
          size={7}
          backgroundColor="white"
          value={value}
        />
        <FormControl display="flex">
          <chakra.input
            type="color"
            {...input}
            backgroundColor={value}
            value={value}
            onChange={(e) => handleChange?.(e.target.value)}
            __css={{ ...styles.field, px: 0, w: styles.field.h, borderRadius: "full" }}
            sx={{
              "::-webkit-color-swatch": { opacity: 0 },
              "::-moz-color-swatch": { opacity: 0 },
            }}
          />
        </FormControl>
      </HStack>
    );
  }
);
