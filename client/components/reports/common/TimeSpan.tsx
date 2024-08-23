import { Duration } from "date-fns";
import { FormattedList, IntlShape, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

function quotientAndRemainder(divident: number, divisor: number) {
  return [Math.floor(divident / divisor), divident % divisor];
}

function cleanDuration(value: Duration | number): Duration {
  if (typeof value === "number") {
    const [days, rem0] = quotientAndRemainder(value, 24 * 60 * 60);
    const [hours, rem1] = quotientAndRemainder(rem0, 60 * 60);
    const [minutes, seconds] = quotientAndRemainder(rem1, 60);
    return {
      days,
      hours,
      minutes: minutes > 0 ? minutes : seconds > 0 ? 1 : 0,
    };
  } else {
    return Object.fromEntries(Object.entries(value).filter(([, value]) => isNonNullish(value)));
  }
}

function getParts(intl: IntlShape, duration: Duration) {
  return [
    duration.years
      ? intl.formatMessage(
          {
            id: "component.timespan.years-part",
            defaultMessage: "{n, plural, =1{# year} other{# years}}",
          },
          { n: duration.years },
        )
      : null,
    duration.months
      ? intl.formatMessage(
          {
            id: "component.timespan.months-part",
            defaultMessage: "{n, plural, =1{# month} other{# months}}",
          },
          { n: duration.months },
        )
      : null,
    duration.weeks
      ? intl.formatMessage(
          {
            id: "component.timespan.weeks-part",
            defaultMessage: "{n, plural, =1{# week} other{# weeks}}",
          },
          { n: duration.weeks },
        )
      : null,
    duration.days
      ? intl.formatMessage(
          {
            id: "component.timespan.days-part",
            defaultMessage: "{n, plural, =1{# day} other{# days}}",
          },
          { n: duration.days },
        )
      : null,
    duration.hours
      ? intl.formatMessage(
          {
            id: "component.timespan.hours-part",
            defaultMessage: "{n}h",
          },
          { n: duration.hours },
        )
      : null,
    isNonNullish(duration.minutes)
      ? intl.formatMessage(
          {
            id: "component.timespan.minutes-part",
            defaultMessage: "{n}'",
          },
          { n: duration.minutes },
        )
      : null,
    isNonNullish(duration.seconds)
      ? intl.formatMessage(
          {
            id: "component.timespan.seconds-part",
            defaultMessage: "{n}''",
          },
          { n: duration.seconds },
        )
      : null,
  ].filter(isNonNullish);
}

export function TimeSpan(props: { duration: Duration | number }) {
  const intl = useIntl();
  return (
    <FormattedList
      style="narrow"
      type="unit"
      value={getParts(intl, cleanDuration(props.duration))}
    />
  );
}

export function getTimeSpan(intl: IntlShape, value: Duration | number) {
  return intl.formatList(getParts(intl, cleanDuration(value)), { type: "unit", style: "narrow" });
}
