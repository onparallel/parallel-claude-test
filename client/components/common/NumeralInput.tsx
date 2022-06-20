import { FormControlOptions, Input, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import NumberFormat, { NumberFormatValues, SourceInfo } from "react-number-format";
import { isDefined } from "remeda";

interface NumeralInputProps extends ThemingProps<"Input">, FormControlOptions {
  decimals?: number;
  allowNegative?: boolean;
  onChange: (value: number | undefined) => void;
  value: number | undefined;
  prefix?: string;
  suffix?: string;
}

export const NumeralInput = chakraForwardRef<"input", NumeralInputProps>(function NumeralInput(
  { decimals, allowNegative, value, prefix, suffix, onChange, ...props },
  ref
) {
  const intl = useIntl();
  const [_value, setValue] = useState(
    isDefined(value)
      ? intl.formatNumber(value, {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals ?? 5,
        })
      : ""
  );

  const { decimalSeparator, thousandSeparator } = useMemo<{
    decimalSeparator: string;
    thousandSeparator: string;
  }>(() => {
    const parts = Intl.NumberFormat(intl.locale).formatToParts(10000.1);
    return {
      decimalSeparator: parts.find((p) => p.type === "decimal")!.value,
      thousandSeparator: parts.find((p) => p.type === "group")!.value,
    };
  }, [intl.locale]);

  const handleOnValueChange = (values: NumberFormatValues, sourceInfo: SourceInfo) => {
    const { formattedValue, floatValue } = values;
    setValue(formattedValue);

    // Event is a Synthetic Event wrapper which holds target and other information.
    // Source tells whether the reason for this function being triggered was an 'event' or due to a 'prop' change
    const { event, source } = sourceInfo;
    if (source === "event" && (event.type === "change" || event.type === "keydown")) {
      onChange(floatValue);
    }
  };

  return (
    <Input
      as={NumberFormat}
      getInputRef={ref}
      prefix={prefix ?? ""}
      suffix={suffix ?? ""}
      thousandSeparator={thousandSeparator}
      decimalSeparator={decimalSeparator}
      decimalScale={decimals ?? 5}
      allowNegative={allowNegative ?? true}
      value={_value}
      onValueChange={handleOnValueChange}
      {...props}
    />
  );
});
