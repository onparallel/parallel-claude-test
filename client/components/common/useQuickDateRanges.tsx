import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  isEqual,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

export type DateRange<IsNullable extends boolean = false> = IsNullable extends true
  ? [startDate: Date | null, endDate: Date | null]
  : [startDate: Date, endDate: Date];

export function isEqualDateRange(range: DateRange, rangeToCompare: DateRange) {
  return isEqual(range[0], rangeToCompare[0]) && isEqual(range[1], rangeToCompare[1]);
}

export function isDateRangeDefined(range: DateRange<true>): range is DateRange<false> {
  return isDefined(range[0]) && isDefined(range[1]);
}

export function useQuickDateRanges() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: `current-month`,
        text: intl.formatMessage({
          id: "generic.current-month",
          defaultMessage: "Current month",
        }),
        range: [startOfMonth(new Date()), endOfMonth(new Date())] as DateRange,
      },
      {
        key: `last-month`,
        text: intl.formatMessage({
          id: "generic.last-month",
          defaultMessage: "Last month",
        }),
        range: [
          subMonths(startOfMonth(new Date()), 1),
          subMonths(endOfMonth(new Date()), 1),
        ] as DateRange,
      },
      {
        key: `current-quarter`,
        text: intl.formatMessage({
          id: "generic.current-quarter",
          defaultMessage: "Current quarter",
        }),
        range: [startOfQuarter(new Date()), endOfQuarter(new Date())] as DateRange,
      },
      {
        key: `last-quarter`,
        text: intl.formatMessage({
          id: "generic.last-quarter",
          defaultMessage: "Last quarter",
        }),
        range: [
          subQuarters(startOfQuarter(new Date()), 1),
          subQuarters(endOfQuarter(new Date()), 1),
        ] as DateRange,
      },
      {
        key: `current-year`,
        text: intl.formatMessage({
          id: "generic.current-year",
          defaultMessage: "Current year",
        }),
        range: [startOfYear(new Date()), endOfYear(new Date())] as DateRange,
      },
      {
        key: `last-year`,
        text: intl.formatMessage({
          id: "generic.last-year",
          defaultMessage: "Last year",
        }),
        range: [
          subYears(startOfYear(new Date()), 1),
          subYears(endOfYear(new Date()), 1),
        ] as DateRange,
      },
    ],
    [intl.locale, startOfDay(new Date()).valueOf()]
  );
}
