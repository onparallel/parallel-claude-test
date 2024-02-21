import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { Duration } from "date-fns";
import { isDefined } from "remeda";

export function expirationToDuration(expiration: ExpirationOption): Duration {
  const [value, period, beforeAfter] = expiration.split("_") as [
    "1" | "2" | "3" | "7" | "15",
    "MONTHS" | "DAYS",
    "BEFORE" | "AFTER",
  ];

  return {
    months: period === "MONTHS" ? parseInt(value) * (beforeAfter === "BEFORE" ? 1 : -1) : undefined,
    days: period === "DAYS" ? parseInt(value) * (beforeAfter === "BEFORE" ? 1 : -1) : undefined,
  };
}

export function durationToExpiration(duration: Duration): ExpirationOption {
  if (isDefined(duration.months) && duration.months !== 0) {
    return `${Math.abs(duration.months)}_MONTHS_${duration.months > 0 ? "BEFORE" : "AFTER"}` as any;
  } else if (isDefined(duration.days) && duration.days !== 0) {
    return `${Math.abs(duration.days)}_DAYS_${duration.days > 0 ? "BEFORE" : "AFTER"}` as any;
  } else {
    throw new Error(`Unexpected duration ${JSON.stringify(duration)}`);
  }
}

export type ExpirationOption =
  | "3_MONTHS_BEFORE"
  | "2_MONTHS_BEFORE"
  | "1_MONTHS_BEFORE"
  | "15_DAYS_BEFORE"
  | "7_DAYS_BEFORE"
  | "1_DAYS_BEFORE"
  | "7_DAYS_AFTER"
  | "1_MONTHS_AFTER"
  | "DO_NOT_REMEMBER";

export function useExpirationOptions() {
  return useSimpleSelectOptions(
    (intl) => [
      ...([3, 2, 1] as const).map((count) => ({
        value: `${count}_MONTHS_BEFORE` as const,
        label: intl.formatMessage(
          {
            id: "generic.n-months-before",
            defaultMessage: "{count, plural, =1 {1 month} other {# months}} before",
          },
          { count },
        ),
      })),
      ...([15, 7, 1] as const).map((count) => ({
        value: `${count}_DAYS_BEFORE` as const,
        label: intl.formatMessage(
          {
            id: "generic.n-days-before",
            defaultMessage: "{count, plural, =1 {1 day} other {# days}} before",
          },
          { count },
        ),
      })),
      {
        value: "7_DAYS_AFTER",
        label: intl.formatMessage(
          {
            id: "generic.n-days-after",
            defaultMessage: "{count, plural, =1 {1 day} other {# days}} after",
          },
          { count: 7 },
        ),
      },
      {
        value: "1_MONTHS_AFTER",
        label: intl.formatMessage(
          {
            id: "generic.n-months-after",
            defaultMessage: "{count, plural, =1 {1 month} other {# months}} after",
          },
          { count: 1 },
        ),
      },
      {
        value: "DO_NOT_REMEMBER",
        label: intl.formatMessage({
          id: "component.use-expiration-options.do-not-remember",
          defaultMessage: "Do not remember",
        }),
      },
    ],
    [],
  );
}
