import { FormattedDate } from "react-intl";
import { DateTimeFormatOptions } from "../../util/dates";

export interface DateTimeProps {
  value: Date | string | number;
  format: DateTimeFormatOptions;
}

export function DateTime({ value, format }: DateTimeProps) {
  const date = new Date(value);
  return <FormattedDate value={date} {...format} />;
}
