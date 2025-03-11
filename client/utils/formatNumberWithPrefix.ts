import { IntlShape } from "react-intl";
import { isNonNullish } from "remeda";
import { FieldOptions } from "./fieldOptions";

export function formatNumberWithPrefix(
  intl: IntlShape,
  value: number,
  options: FieldOptions["NUMBER"],
): string {
  const hasPrefix = isNonNullish(options.prefix) || isNonNullish(options.suffix) ? true : false;
  const formattedValue = intl.formatNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  });
  const isNegative = value < 0;

  if (hasPrefix) {
    if (isNonNullish(options.prefix)) {
      return isNegative
        ? formattedValue.replace("-", "-" + options.prefix)
        : options.prefix + formattedValue;
    } else {
      return formattedValue + options.suffix;
    }
  }

  return formattedValue;
}
