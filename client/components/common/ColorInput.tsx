import {
  chakra,
  FormControl,
  FormControlOptions,
  omitThemingProps,
  ThemingProps,
  useFormControl,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import { cx } from "@chakra-ui/utils";
import { chakraComponent } from "@parallel/chakra/utils";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { HStack } from "@parallel/components/ui";
import { IMaskInput } from "react-imask";
import { omit } from "remeda";
import { noop } from "ts-essentials";

interface ColorInputProps extends ThemingProps<"Input">, FormControlOptions {
  value: string;
  onChange?: (value: string) => any;
}

export const ColorInput = chakraComponent<"input", ColorInputProps, HTMLInputElement>(
  function ColorInput({ ref, value, onChange, ...props }) {
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
            __css={{
              ...omit(styles.field, ["px", "bg"]),
              width: styles.field.height as any,
              borderRadius: "full",
            }}
            sx={{
              "::-webkit-color-swatch": { opacity: 0 },
              "::-moz-color-swatch": { opacity: 0 },
            }}
          />
        </FormControl>
      </HStack>
    );
  },
);
