import { Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { DateTimeFormatOptions } from "@parallel/utils/dates";
import { useForceUpdate } from "@parallel/utils/useForceUpdate";
import classNames from "classnames";
import { useEffect } from "react";
import { FormattedDate, FormattedMessage, FormattedRelativeTime, useIntl } from "react-intl";

export interface DateTimeProps extends TextProps {
  value: Date | string | number;
  format: DateTimeFormatOptions;
  useRelativeTime?: boolean | "always";
}

type Unit = "second" | "minute" | "hour" | "day" | "month" | "year";

function isSmallRelativeTime(unit: Unit): unit is "second" | "minute" | "hour" {
  return ["second", "minute", "hour"].includes(unit);
}

const units: { threshold: number; seconds: number; unit: Unit }[] = [
  { threshold: 60, seconds: 60, unit: "minute" },
  { threshold: 60 * 60, seconds: 60 * 60, unit: "hour" },
  { threshold: 60 * 60 * 24, seconds: 60 * 60 * 24, unit: "day" },
  { threshold: 60 * 60 * 24 * 60, seconds: 60 * 60 * 24 * 30, unit: "month" },
  { threshold: 60 * 60 * 24 * 365, seconds: 60 * 60 * 24 * 365, unit: "year" },
];

function selectUnit(from: Date | number, to: Date | number) {
  const diff = (new Date(from).valueOf() - new Date(to).valueOf()) / 1000;
  let unit: Unit = "second";
  let value = diff;
  for (const { threshold, seconds, unit: _unit } of units) {
    if (Math.abs(diff) > threshold) {
      unit = _unit;
      value = diff < 0 ? Math.ceil(diff / seconds) : Math.floor(diff / seconds);
    }
  }
  return { value, unit };
}

export const DateTime = chakraForwardRef<"time", DateTimeProps>(function DateTime(
  { value, format, useRelativeTime, ...props },
  ref
) {
  const intl = useIntl();
  const date = new Date(value);
  const { value: _value, unit } = selectUnit(date, Date.now());
  const forceUpdate = useForceUpdate();

  const _useRelativeTime =
    useRelativeTime === "always" || (useRelativeTime && isSmallRelativeTime(unit));
  useEffect(() => {
    if (_useRelativeTime) {
      const intervalId = setInterval(forceUpdate, 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [_useRelativeTime]);
  return (
    <Text
      ref={ref as any}
      as="time"
      title={_useRelativeTime ? intl.formatDate(date, format) : undefined}
      {...props}
      {...{ dateTime: date.toISOString() }}
      className={classNames(props.className, "notranslate")}
    >
      {!_useRelativeTime ? (
        <FormattedDate value={date} {...format} />
      ) : unit === "second" ? (
        <FormattedMessage id="component.date-time.a-moment-ago" defaultMessage="a moment ago" />
      ) : (
        <FormattedRelativeTime value={_value} unit={unit} />
      )}
    </Text>
  );
});
