import { FormatNumberOptions, IntlShape } from "react-intl";

const UNITS = ["B", "kB", "MB", "GB", "TB", "PB"] as const;

export interface FileSizeProps {
  value: number;
}

export function fileSize(
  intl: IntlShape,
  value: number,
  opts: FormatNumberOptions = { maximumSignificantDigits: 3 },
) {
  let unit = 0;
  let _value = value;
  while (_value >= 1024 && unit < UNITS.length - 1) {
    _value /= 1024;
    unit += 1;
  }
  return `${intl.formatNumber(_value, opts)} ${UNITS[unit]}`;
}

export function toBytes(value: number, unit: (typeof UNITS)[number]) {
  if (!UNITS.includes(unit)) {
    throw new Error("Invalid unit");
  }
  return value * Math.pow(1024, UNITS.indexOf(unit));
}
