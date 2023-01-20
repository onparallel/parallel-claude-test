import { Duration } from "date-fns";
import { FormattedList, FormattedMessage } from "react-intl";
import { isDefined } from "remeda";

function quotientAndRemainder(divident: number, divisor: number) {
  return [Math.floor(divident / divisor), divident % divisor];
}

export function TimeSpan(props: { duration: Duration | number }) {
  let duration: Duration = {};
  if (typeof props.duration === "number") {
    const [days, rem0] = quotientAndRemainder(props.duration, 24 * 60 * 60);
    const [hours, rem1] = quotientAndRemainder(rem0, 60 * 60);
    const [minutes, _] = quotientAndRemainder(rem1, 60);
    duration = { days, hours, minutes };
  } else {
    Object.entries(props.duration).forEach(([key, value]) => {
      if (value !== null) {
        duration[key as keyof Duration] = value as number;
      }
    });
  }
  return (
    <FormattedList
      style="narrow"
      type="unit"
      value={[
        isDefined(duration.years) ? (
          <FormattedMessage
            key="years"
            id="component.timespan.years-part"
            defaultMessage="{n, plural, =1{# year} other{# years}}"
            values={{ n: duration.years }}
          />
        ) : null,
        isDefined(duration.months) ? (
          <FormattedMessage
            key="months"
            id="component.timespan.months-part"
            defaultMessage="{n, plural, =1{# month} other{# months}}"
            values={{ n: duration.months }}
          />
        ) : null,
        isDefined(duration.weeks) ? (
          <FormattedMessage
            key="weeks"
            id="component.timespan.weeks-part"
            defaultMessage="{n, plural, =1{# week} other{# weeks}}"
            values={{ n: duration.weeks }}
          />
        ) : null,
        isDefined(duration.days) ? (
          <FormattedMessage
            key="days"
            id="component.timespan.days-part"
            defaultMessage="{n, plural, =1{# day} other{# days}}"
            values={{ n: duration.days }}
          />
        ) : null,
        isDefined(duration.hours) ? (
          <FormattedMessage
            key="hours"
            id="component.timespan.hours-part"
            defaultMessage="{n}h"
            values={{ n: duration.hours }}
          />
        ) : null,
        isDefined(duration.minutes) ? (
          <FormattedMessage
            key="minutes"
            id="component.timespan.minutes-part"
            defaultMessage="{n}'"
            values={{ n: duration.minutes }}
          />
        ) : null,
        isDefined(duration.seconds) ? (
          <FormattedMessage
            key="seconds"
            id="component.timespan.seconds-part"
            defaultMessage="{n}''"
            values={{ n: duration.seconds }}
          />
        ) : null,
      ].filter(isDefined)}
    />
  );
}
