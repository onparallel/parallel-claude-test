import { Text, BoxProps } from "@chakra-ui/core";
import { DateTimeFormatOptions } from "@parallel/utils/dates";
import { selectUnit } from "@formatjs/intl-utils";
import { FormattedRelativeTime, FormattedDate, useIntl } from "react-intl";

export type DateTimeProps = BoxProps & {
  value: Date | string | number;
  format: DateTimeFormatOptions;
  useRelativeTime?: boolean | "always";
};

export function DateTime({
  value,
  format,
  useRelativeTime,
  ...props
}: DateTimeProps) {
  const intl = useIntl();
  const date = new Date(value);
  if (useRelativeTime) {
    const { value: _value, unit } = selectUnit(date, Date.now(), { day: 60 });
    if (
      useRelativeTime === "always" ||
      ["second", "minute", "hour"].includes(unit)
    ) {
      return (
        <Text
          as="time"
          title={intl.formatDate(date, format)}
          {...props}
          {...{ dateTime: date.toISOString() }}
        >
          <FormattedRelativeTime value={_value} unit={unit} />
        </Text>
      );
    }
  }
  return (
    <Text as="time" {...props} {...{ dateTime: date.toISOString() }}>
      <FormattedDate value={date} {...format} />
    </Text>
  );
}
