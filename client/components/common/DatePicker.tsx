import { Box, Button, Flex } from "@chakra-ui/core";
import { FORMATS } from "@parallel/utils/dates";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  getDay,
  getMonth,
  getYear,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  isWeekend,
  subDays,
  isPast,
} from "date-fns";
import { memo, useState, useCallback } from "react";
import { FormattedDate, useIntl } from "react-intl";
import { chunk } from "remeda";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { ChevronLeftIcon, ChevronRightIcon } from "@parallel/chakra/icons";

export function DatePicker({
  value,
  onChange,
  isDisabledDate,
  isPastAllowed,
}: {
  value?: Date | null;
  onChange?: (value: Date) => void;
  isPastAllowed?: boolean;
  isDisabledDate?: (date: Date) => boolean;
}) {
  const intl = useIntl();
  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(value || new Date())
  );
  const selectedDate = value ? startOfDay(value) : undefined;
  const month = getMonth(currentMonth);
  const year = getYear(currentMonth);
  const firstDayOfWeek = 1;

  const handleDateSelected = useCallback(
    function (date: Date) {
      setCurrentMonth(startOfMonth(date));
      onChange?.(date);
    },
    [onChange]
  );

  const _isDisabledDate = useCallback(
    function (date: Date) {
      if (!isPastAllowed && isPast(date) && !isToday(date)) {
        return true;
      }
      if (isDisabledDate) {
        return isDisabledDate(date);
      }
      return false;
    },
    [isPastAllowed, isDisabledDate]
  );

  return (
    <Flex direction="column">
      <Flex marginBottom={2}>
        <IconButtonWithTooltip
          icon={<ChevronLeftIcon />}
          size="sm"
          label={intl.formatMessage({
            id: "component.date-picker.prev-month",
            defaultMessage: "Previous month",
          })}
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        />
        <Flex
          flex="1"
          alignItems="center"
          justifyContent="center"
          fontWeight="bold"
        >
          <FormattedDate value={currentMonth} month="long" year="numeric" />
        </Flex>
        <IconButtonWithTooltip
          icon={<ChevronRightIcon />}
          size="sm"
          label={intl.formatMessage({
            id: "component.date-picker.next-month",
            defaultMessage: "Next month",
          })}
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        />
      </Flex>
      <Month
        key={`${year}-${month}`}
        year={year}
        month={month}
        firstDayOfWeek={firstDayOfWeek}
        selectedDate={selectedDate}
        onDateSelected={handleDateSelected}
        isDateDisabled={_isDisabledDate}
      />
    </Flex>
  );
}

const Month = memo(function Month({
  month,
  year,
  firstDayOfWeek,
  selectedDate,
  onDateSelected,
  isDateDisabled,
}: {
  month: number;
  year: number;
  firstDayOfWeek: 0 | 1;
  selectedDate?: Date;
  onDateSelected?: (value: Date) => void;
  isDateDisabled?: (value: Date) => boolean;
}) {
  const intl = useIntl();
  const days = getDays({ year, month, firstDayOfWeek });
  const weekDays = getWeekDays({ firstDayOfWeek });

  return (
    <Box as="table" width="100%">
      <Box as="colgroup">
        {weekDays.map((day, index) => (
          <Box
            as="col"
            key={index}
            backgroundColor={isWeekend(day) ? "gray.50" : undefined}
          />
        ))}
      </Box>
      <Box as="thead">
        <Box as="tr">
          {weekDays.map((day, index) => (
            <Box as="th" key={index}>
              <FormattedDate value={day} weekday="narrow" />
            </Box>
          ))}
        </Box>
      </Box>
      <Box as="tbody">
        {chunk(days, 7).map((week, index) => (
          <Box as="tr" key={index}>
            {week.map(({ date, isNextMonth, isPrevMonth }, index) => {
              return (
                <Box as="td" key={index} padding="2px" textAlign="center">
                  <Button
                    padding="0"
                    size="sm"
                    {...(selectedDate && isSameDay(date, selectedDate)
                      ? {
                          variant: "solid",
                          colorScheme: "purple",
                        }
                      : isToday(date)
                      ? {
                          variant: "solid",
                        }
                      : {
                          variant: "ghost",
                        })}
                    opacity={isNextMonth || isPrevMonth ? 0.4 : 1}
                    isDisabled={isDateDisabled?.(date) || false}
                    borderRadius="40px"
                    aria-label={intl.formatDate(date, FORMATS.LL)}
                    onClick={() => onDateSelected?.(date)}
                  >
                    <FormattedDate value={date} day="numeric" />
                  </Button>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
});

export function getWeekDays({ firstDayOfWeek }: { firstDayOfWeek: 0 | 1 }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: firstDayOfWeek });
  return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
}

export function getDays({
  year,
  month,
  firstDayOfWeek,
}: {
  year: number;
  month: number;
  firstDayOfWeek: 0 | 1;
}): { date: Date; isNextMonth?: boolean; isPrevMonth?: boolean }[] {
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
    ).map((date) => ({ isPrevMonth: true, date })),
    ...eachDayOfInterval({ start: monthStart, end: monthEnd }).map((date) => ({
      date,
    })),
    ...(nextMonthDays
      ? eachDayOfInterval({
          start: addDays(monthEnd, 1),
          end: addDays(monthEnd, nextMonthDays),
        })
      : []
    ).map((date) => ({ isNextMonth: true, date })),
  ];
}
