import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { FieldOptions } from "./petitionFields";

export function formatNumberWithPrefix(value: number, options: FieldOptions["NUMBER"]): string {
  const intl = useIntl();
  const hasPrefix = isDefined(options.prefix) || isDefined(options.suffix) ? true : false;
  const formattedValue = intl.formatNumber(value);

  if (hasPrefix) {
    if (isDefined(options.prefix)) {
      return options.prefix + formattedValue;
    } else {
      return formattedValue + options.suffix;
    }
  }

  return formattedValue;
}
