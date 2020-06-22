import { memo } from "react";
import { FormatNumberOptions, IntlShape, useIntl } from "react-intl";

const UNITS = ["B", "kB", "MB", "GB", "TB", "PB"] as const;

export type FileSizeProps = {
  value: number;
};

export function fileSize(
  intl: IntlShape,
  value: number,
  opts: FormatNumberOptions = { maximumSignificantDigits: 3 }
) {
  let unit = 0;
  let _value = value;
  while (_value > 1024 && unit < UNITS.length - 1) {
    _value /= 1024;
    unit += 1;
  }
  return `${intl.formatNumber(_value, opts)} ${UNITS[unit]}`;
}

export const FileSize = memo(function ({ value }: FileSizeProps) {
  const intl = useIntl();
  return <>{fileSize(intl, value)}</>;
});
