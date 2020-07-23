import { DateTimeFormatOptions } from "../utils/dates";
import * as React from "react";
import { FormattedDate } from "react-intl";

export type DateTimeProps = {
  value: Date | string | number;
  format: DateTimeFormatOptions;
};

export function DateTime({ value, format }: DateTimeProps) {
  const date = new Date(value);
  return <FormattedDate value={date} {...format} />;
}
