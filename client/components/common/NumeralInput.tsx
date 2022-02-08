import { FormControlOptions, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CleaveOptions } from "cleave.js/options";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { InputCleave } from "./InputCleave";

interface NumeralInputProps extends ThemingProps<"Input">, FormControlOptions {
  decimals?: number;
  positiveOnly?: boolean;
}

export const NumeralInput = chakraForwardRef<"input", NumeralInputProps>(function NumeralInput(
  { decimals, positiveOnly, ...props },
  ref
) {
  const intl = useIntl();
  const cleaveOptions = useMemo<CleaveOptions>(() => {
    const parts = Intl.NumberFormat(intl.locale).formatToParts(10000.1);
    return {
      numeral: true,
      numeralDecimalMark: parts.find((p) => p.type === "decimal")!.value,
      delimiter: parts.find((p) => p.type === "group")!.value,
      numeralDecimalScale: decimals ?? 5,
      numeralPositiveOnly: positiveOnly,
    };
  }, [intl.locale, decimals, positiveOnly]);
  return (
    <InputCleave
      ref={ref}
      inputMode={decimals === 0 ? "numeric" : "decimal"}
      options={cleaveOptions}
      {...props}
    />
  );
});
