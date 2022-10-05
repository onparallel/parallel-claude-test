import { Stack } from "@chakra-ui/react";
import { getMonth, getYear, isPast, isSameDay, isToday, startOfDay, startOfMonth } from "date-fns";
import { useCallback, useState } from "react";
import { useIntl } from "react-intl";
import { CalendarMonth, CalendarMonthDateProps } from "./CalendarMonth";
import { CalendarMonthHeader } from "./CalendarMonthHeader";

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
      <CalendarMonthHeader value={currentMonth} onChange={(value) => setCurrentMonth(value)} />
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
