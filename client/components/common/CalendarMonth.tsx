import { Box, BoxProps, Button, ButtonProps, chakra } from "@chakra-ui/react";
import { FORMATS } from "@parallel/utils/dates";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  getDay,
  isToday,
  isWeekend,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { FormattedDate, useIntl } from "react-intl";
import { chunk } from "remeda";

export type CalendarMonthDateProps = (value: {
  date: Date;
  isNextMonth: boolean;
  isPrevMonth: boolean;
}) => ButtonProps;

export type CalendarMonthDateWrapperProps = (value: {
  date: Date;
  isNextMonth: boolean;
  isPrevMonth: boolean;
}) => BoxProps;

export interface CalendarMonthProps {
  month: number;
  year: number;
  firstDayOfWeek: 0 | 1;
  onDateClick?: (value: Date) => void;
  onDateHover?: (value: Date | null) => void;
  dateProps?: CalendarMonthDateProps;
  wrapperProps?: CalendarMonthDateWrapperProps;
}

export function CalendarMonth({
  month,
  year,
  firstDayOfWeek,
  onDateClick,
  onDateHover,
  dateProps,
  wrapperProps,
}: CalendarMonthProps) {
  const intl = useIntl();
  const days = getDays({ year, month, firstDayOfWeek });
  const weekDays = getWeekDays({ firstDayOfWeek });

  return (
    <Box as="table" width="100%" onMouseLeave={() => onDateHover?.(null)}>
      <chakra.colgroup sx={{ "[data-is-weekend]": { backgroundColor: "gray.50" } }}>
        {weekDays.map((day, index) => (
          <col data-is-weekend={isWeekend(day) ? "" : undefined} key={index} />
        ))}
      </chakra.colgroup>
      <thead>
        <tr>
          {weekDays.map((day, index) => (
            <th key={index}>
              <FormattedDate value={day} weekday="narrow" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {chunk(days, 7).map((week, index) => (
          <tr key={index}>
            {week.map(({ date, isNextMonth, isPrevMonth }, index) => {
              return (
                <Box as="td" key={index} paddingY="2px" paddingX={0} position="relative">
                  <Box
                    as="span"
                    display="inline-flex"
                    justifyContent="center"
                    width="100%"
                    {...wrapperProps?.({ date, isNextMonth, isPrevMonth })}
                  >
                    <Button
                      paddingX="0"
                      borderRadius="full"
                      size="sm"
                      aria-label={intl.formatDate(date, FORMATS.LL)}
                      {...(isToday(date) ? { "aria-current": "date" } : {})}
                      {...dateProps?.({ date, isNextMonth, isPrevMonth })}
                      onClick={() => onDateClick?.(date)}
                      onMouseEnter={() => onDateHover?.(date)}
                    >
                      <FormattedDate value={date} day="numeric" />
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Box>
  );
}

function getWeekDays({ firstDayOfWeek }: { firstDayOfWeek: 0 | 1 }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: firstDayOfWeek });
  return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
}

function getDays({
  year,
  month,
  firstDayOfWeek,
}: {
  year: number;
  month: number;
  firstDayOfWeek: 0 | 1;
}): { date: Date; isNextMonth: boolean; isPrevMonth: boolean }[] {
  const date = new Date(year, month);

  const monthStart = startOfMonth(date);
  const monthStartDay = getDay(monthStart);
  const monthEnd = endOfMonth(date);
  const monthEndDay = getDay(monthEnd);

  const prevMonthDays = (7 - firstDayOfWeek + monthStartDay) % 7;
  const nextMonthDays = (7 - monthEndDay + firstDayOfWeek - 1) % 7;
  return [
    ...(prevMonthDays
      ? eachDayOfInterval({
          start: subDays(monthStart, prevMonthDays),
          end: subDays(monthStart, 1),
        })
      : []
    ).map((date) => ({ isPrevMonth: true, isNextMonth: false, date })),
    ...eachDayOfInterval({ start: monthStart, end: monthEnd }).map((date) => ({
      date,
      isPrevMonth: false,
      isNextMonth: false,
    })),
    ...(nextMonthDays
      ? eachDayOfInterval({
          start: addDays(monthEnd, 1),
          end: addDays(monthEnd, nextMonthDays),
        })
      : []
    ).map((date) => ({ isPrevMonth: false, isNextMonth: true, date })),
  ];
}
