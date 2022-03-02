import { FormControlOptions, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import useMergedRef from "@react-hook/merged-ref";
import { CleaveOptions } from "cleave.js/options";
import escapeStringRegexp from "escape-string-regexp";
import { ChangeEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { InputCleave, InputCleaveElement } from "./InputCleave";

interface NumeralInputProps extends ThemingProps<"Input">, FormControlOptions {
  decimals?: number;
  positiveOnly?: boolean;
  onChange: (value: number | undefined) => void;
  value: number | undefined;
  prefix?: string;
  tailPrefix?: boolean;
}

export const NumeralInput = chakraForwardRef<"input", NumeralInputProps>(function NumeralInput(
  { decimals, positiveOnly, value, prefix, tailPrefix, onChange, onKeyDown, ...props },
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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Backspace" &&
      prefix &&
      tailPrefix &&
      inputRef.current &&
      isDefined(inputRef.current.selectionStart) &&
      inputRef.current.selectionStart > inputRef.current.value.length - prefix.length
    ) {
      const newValue = inputRef.current.value.replace(
        new RegExp(
          tailPrefix ? `${escapeStringRegexp(prefix)}$` : `^${escapeStringRegexp(prefix)}`
        ),
        ""
      );
      setValue(newValue.slice(0, -1));
    }
  };

  return (
    <InputCleave
      ref={mergedRef}
      inputMode="decimal"
      options={cleaveOptions}
      value={_value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});
