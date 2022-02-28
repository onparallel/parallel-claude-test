import { FormControlOptions, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import useMergedRef from "@react-hook/merged-ref";
import { CleaveOptions } from "cleave.js/options";
import { ChangeEvent, FocusEvent, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { InputCleave, InputCleaveElement } from "./InputCleave";
import escapeStringRegexp from "escape-string-regexp";

interface NumeralInputProps extends ThemingProps<"Input">, FormControlOptions {
  decimals?: number;
  positiveOnly?: boolean;
  onChange: (value: number | undefined) => void;
  value: number | undefined;
  prefix?: string;
  tailPrefix?: boolean;
}

export const NumeralInput = chakraForwardRef<"input", NumeralInputProps>(function NumeralInput(
  { decimals, positiveOnly, value, prefix, tailPrefix, onChange, onFocus, ...props },
  ref
) {
  const intl = useIntl();

  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);

  const cleaveOptions = useMemo<CleaveOptions>(() => {
    const parts = Intl.NumberFormat(intl.locale).formatToParts(10000.1);
    return {
      numeral: true,
      numeralDecimalMark: parts.find((p) => p.type === "decimal")!.value,
      delimiter: parts.find((p) => p.type === "group")!.value,
      numeralDecimalScale: decimals ?? 5,
      numeralPositiveOnly: positiveOnly,
      prefix,
      tailPrefix,
      noImmediatePrefix: true,
    };
  }, [intl.locale, decimals, positiveOnly]);

  const [_value, setValue] = useState(
    isDefined(value)
      ? intl.formatNumber(value, {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals ?? 5,
        })
      : ""
  );
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (e.target.value === "") {
      onChange?.(undefined);
    } else {
      const rawValue = prefix
        ? (e.target as InputCleaveElement).rawValue?.replace(
            new RegExp(
              tailPrefix ? `${escapeStringRegexp(prefix)}$` : `^${escapeStringRegexp(prefix)}`
            ),
            ""
          )
        : (e.target as InputCleaveElement).rawValue;
      const numericValue = Number(rawValue);
      if (!Number.isNaN(numericValue)) {
        onChange?.(numericValue);
      }
    }
  };

  const handleOnFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (
      prefix &&
      tailPrefix &&
      isDefined(e.target.selectionStart) &&
      e.target.selectionStart > e.target.value.length - prefix.length
    ) {
      // move he cursor before the suffix
      inputRef.current?.setSelectionRange(
        e.target.value.length - prefix.length,
        e.target.value.length - prefix.length
      );
    }
    onFocus?.(e);
  };
  return (
    <InputCleave
      ref={mergedRef}
      inputMode="decimal"
      options={cleaveOptions}
      value={_value}
      onChange={handleChange}
      onFocus={handleOnFocus}
      {...props}
    />
  );
});
