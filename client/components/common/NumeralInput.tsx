import { FormControlOptions, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CleaveOptions } from "cleave.js/options";
import { ChangeEvent, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { InputCleave, InputCleaveElement } from "./InputCleave";

interface NumeralInputProps extends ThemingProps<"Input">, FormControlOptions {
  decimals?: number;
  positiveOnly?: boolean;
  onChange: (value: number | undefined) => void;
  value: number | undefined;
}

export const NumeralInput = chakraForwardRef<"input", NumeralInputProps>(function NumeralInput(
  { decimals, positiveOnly, value, onChange, ...props },
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
  const [_value, setValue] = useState(isDefined(value) ? intl.formatNumber(value) : "");
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (e.target.value === "") {
      onChange?.(undefined);
    } else {
      const numericValue = Number((e.target as InputCleaveElement).rawValue);
      if (!Number.isNaN(value)) {
        onChange?.(numericValue);
      }
    }
  };
  return (
    <InputCleave
      ref={ref}
      inputMode="decimal"
      options={cleaveOptions}
      value={_value}
      onChange={handleChange}
      {...props}
    />
  );
});
