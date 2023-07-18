import { IntlShape } from "react-intl";
import { isDefined } from "remeda";

export function formatNumberWithPrefix(intl: IntlShape, value: number, options: any): string {
  const hasPrefix = isDefined(options.prefix) || isDefined(options.suffix) ? true : false;
  const formattedValue = intl.formatNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  });
  const isNegative = value < 0;

  if (hasPrefix) {
    if (isDefined(options.prefix)) {
      return isNegative
        ? formattedValue.replace("-", "-" + options.prefix)
        : options.prefix + formattedValue;
    } else {
      return formattedValue + options.suffix;
    }
  }

  return formattedValue;
}
