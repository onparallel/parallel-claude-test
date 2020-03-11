import { Text, BoxProps } from "@chakra-ui/core";
import { DateTimeFormatOptions } from "@parallel/utils/dates";
import { selectUnit } from "@formatjs/intl-utils";
import { FormattedRelativeTime, FormattedDate } from "react-intl";

export type DateTimeProps = BoxProps & {
  value: Date | string | number;
  format: DateTimeFormatOptions;
  useRelativeTime?: boolean;
};

export function DateTime({
  value,
  format,
  useRelativeTime,
  ...props
}: DateTimeProps) {
  const date = new Date(value);
  if (useRelativeTime) {
    const { value: _value, unit } = selectUnit(date);
    if (["second", "minute", "hour"].includes(unit)) {
      return (
        <Text as="time" {...props} {...{ dateTime: date.toISOString() }}>
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
