import { Button, Flex, HStack, Stack } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, FieldDateIcon } from "@parallel/chakra/icons";
import { FORMATS } from "@parallel/utils/dates";
import {
  addMonths,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isEqual,
  isFuture,
  isPast,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { FormattedDate, useIntl } from "react-intl";
import {
  CalendarMonth,
  CalendarMonthDateProps,
  CalendarMonthDateWrapperProps,
} from "./CalendarMonth";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  isPastAllowed,
  isFutureAllowed,
}: {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartChange?: (value: Date | null) => void;
  onEndChange?: (value: Date | null) => void;
  isPastAllowed?: boolean;
  isFutureAllowed?: boolean;
}) {
  const intl = useIntl();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(startDate || new Date()));
  const month = getMonth(currentMonth);
  const year = getYear(currentMonth);
  const firstDayOfWeek = 1;
  const [isStartSelected, setIsStartSelected] = useState(startDate && !endDate ? false : true);

  useEffect(() => {
    if (startDate) {
      setCurrentMonth(startOfMonth(startDate));
    }
  }, [startDate]);

  const handleDateSelected = useCallback(
    function (date: Date) {
      setCurrentMonth(startOfMonth(date));

      if (startDate && endDate && isStartSelected) {
        onEndChange?.(null);
        onStartChange?.(date);
      } else {
        if (isStartSelected) {
          onStartChange?.(date);
        } else {
          if (startDate && isBefore(date, startDate)) {
            onEndChange?.(startDate);
            onStartChange?.(date);
          } else {
            onEndChange?.(date);
          }
        }
      }

      setIsStartSelected((current) => !current);
    },
    [isStartSelected, startDate, endDate, onStartChange, onEndChange]
  );

  const wrapperProps = useCallback<CalendarMonthDateWrapperProps>(
    ({ date }) => {
      return { paddingX: "4px", paddingY: "3px" };
    },
    [startDate, endDate]
  );

  const dateProps = useCallback<CalendarMonthDateProps>(
    ({ date, isNextMonth, isPrevMonth }) => {
      const props = {
        variant: "ghost",
        opacity: isNextMonth || isPrevMonth ? 0.4 : 1,
        textDecoration: isToday(date) ? "underline" : "none",
        isDisabled:
          ((!isPastAllowed && isPast(date) && !isToday(date)) ||
            (!isFutureAllowed && isFuture(date) && !isToday(date))) ??
          false,
      };

      if (startDate && !endDate) {
        return {
          ...props,
          ...(isEqual(date, startDate) ? { variant: "solid", colorScheme: "primary" } : {}),
        };
      } else if (startDate && endDate) {
        return {
          ...props,
          ...(isAfter(date, startDate) && isBefore(date, endDate)
            ? { variant: "solid", colorScheme: "primary", backgroundColor: "primary.300" }
            : isEqual(date, startDate) || isEqual(date, endDate)
            ? { variant: "solid", colorScheme: "primary" }
            : {}),
        };
      } else {
        return props;
      }
    },
    [startDate, endDate]
  );

  return (
    <Stack width="min-content">
      <HStack paddingY={1}>
        <Button
          size="sm"
          fontWeight="400"
          color={startDate ? undefined : "gray.400"}
          rightIcon={<FieldDateIcon />}
          variant="outline"
          onClick={() => setIsStartSelected(true)}
          outlineColor={isStartSelected ? "blue.500" : undefined}
          outline={isStartSelected ? "1px solid" : undefined}
          flex="1"
          justifyContent="space-between"
        >
          {startDate
            ? intl.formatDate(startDate, FORMATS.L)
            : intl.formatMessage({
                id: "component.date-range-picker.date-placeholder",
                defaultMessage: "mm-dd-aaaa",
              })}
        </Button>
        <Button
          size="sm"
          fontWeight="400"
          color={endDate ? undefined : "gray.400"}
          rightIcon={<FieldDateIcon />}
          variant="outline"
          onClick={() => setIsStartSelected(false)}
          outlineColor={!isStartSelected ? "blue.500" : undefined}
          outline={!isStartSelected ? "1px solid" : undefined}
          flex="1"
          justifyContent="space-between"
        >
          {endDate
            ? intl.formatDate(endDate, FORMATS.L)
            : intl.formatMessage({
                id: "component.date-range-picker.date-placeholder",
                defaultMessage: "mm-dd-aaaa",
              })}
        </Button>
      </HStack>
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
      </Flex>
      <CalendarMonth
        key={`${year}-${month}`}
        year={year}
        month={month}
        firstDayOfWeek={firstDayOfWeek}
        onDateClick={handleDateSelected}
        dateProps={dateProps}
        wrapperProps={wrapperProps}
      />
    </Stack>
  );
}
