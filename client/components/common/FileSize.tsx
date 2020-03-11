import { memo } from "react";
import { FormattedNumber } from "react-intl";

const UNITS = ["B", "kB", "MB", "GB", "TB", "PB"] as const;

export type FileSizeProps = {
  value: number;
};

export const FileSize = memo(function FileSize({ value }: FileSizeProps) {
  let unit = 0;
  let _value = value;
  while (_value > 1024 && unit < UNITS.length - 1) {
    _value /= 1024;
    unit += 1;
  }
  return (
    <>
      <FormattedNumber
        value={_value}
        maximumSignificantDigits={3}
      ></FormattedNumber>{" "}
      {UNITS[unit]}
    </>
  );
});
