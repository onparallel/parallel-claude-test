import { Text, BoxProps } from "@chakra-ui/core";
import { DateTimeFormatOptions } from "@parallel/utils/dates";
import { selectUnit } from "@formatjs/intl-utils";
import {
  FormattedRelativeTime,
  FormattedDate,
  useIntl,
  FormattedMessage,
} from "react-intl";
import { useEffect } from "react";
import { useForceUpdate } from "@parallel/utils/useForceUpdate";

export type DateTimeProps = BoxProps & {
  value: Date | string | number;
  format: DateTimeFormatOptions;
  useRelativeTime?: boolean | "always";
};

type Unit = ReturnType<typeof selectUnit>["unit"];

function isSmallRelativeTime(unit: Unit): unit is "second" | "minute" | "hour" {
  return ["second", "minute", "hour"].includes(unit);
}

export function DateTime({
  value,
  format,
  useRelativeTime,
  ...props
}: DateTimeProps) {
  const intl = useIntl();
  const date = new Date(value);
  const { value: _value, unit } = selectUnit(date, Date.now(), {
    second: 60,
    minute: 60,
    hour: 24,
    day: 60,
  });
  const forceUpdate = useForceUpdate();
  useEffect(() => {
    if (useRelativeTime && isSmallRelativeTime(unit)) {
      const intervalId = setInterval(forceUpdate, 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [useRelativeTime, unit]);
  if (
    useRelativeTime === "always" ||
    (useRelativeTime && isSmallRelativeTime(unit))
  ) {
    return (
      <Text
        as="time"
        title={intl.formatDate(date, format)}
        {...props}
        {...{ dateTime: date.toISOString() }}
      >
        {unit === "second" ? (
          <FormattedMessage
            id="component.date-time.a-moment-ago"
            defaultMessage="a moment ago"
          />
        ) : (
          <FormattedRelativeTime value={_value} unit={unit} />
        )}
      </Text>
    );
  } else {
    return (
      <Text as="time" {...props} {...{ dateTime: date.toISOString() }}>
        <FormattedDate value={date} {...format} />
      </Text>
    );
  }
}
