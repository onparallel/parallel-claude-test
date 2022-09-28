import { Flex, HStack, Stack } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@parallel/chakra/icons";
import {
  addMonths,
  getMonth,
  getYear,
  isPast,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useCallback, useState } from "react";
import { FormattedDate, useIntl } from "react-intl";
import { CalendarMonth, CalendarMonthDateProps } from "./CalendarMonth";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

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
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(value || new Date()));
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

  const dateProps = useCallback<CalendarMonthDateProps>(
    ({ date, isNextMonth, isPrevMonth }) => {
      return {
        marginX: "2px",
        borderRadius: "full",
        ...(selectedDate && isSameDay(date, selectedDate)
          ? { variant: "solid", colorScheme: "primary" }
          : { variant: "ghost" }),
        textDecoration: isToday(date) ? "underline" : undefined,
        opacity: isNextMonth || isPrevMonth ? 0.4 : 1,
        isDisabled:
          ((!isPastAllowed && isPast(date) && !isToday(date)) || isDisabledDate?.(date)) ?? false,
        onClick: () => handleDateSelected(date),
      };
    },
    [handleDateSelected, isPastAllowed, isDisabledDate, selectedDate]
  );

  return (
    <Stack>
      <HStack>
        <IconButtonWithTooltip
          icon={<ChevronLeftIcon />}
          size="sm"
          label={intl.formatMessage({
            id: "component.date-picker.prev-month",
            defaultMessage: "Previous month",
          })}
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        />
        <Flex flex="1" alignItems="center" justifyContent="center" fontWeight="bold">
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
      </HStack>
      <CalendarMonth
        key={`${year}-${month}`}
        year={year}
        month={month}
        firstDayOfWeek={firstDayOfWeek}
        onDateClick={handleDateSelected}
        dateProps={dateProps}
      />
    </Stack>
  );
}
