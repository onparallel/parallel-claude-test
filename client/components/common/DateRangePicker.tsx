import {
  BoxProps,
  Button,
  ButtonGroup,
  ButtonProps,
  Flex,
  HStack,
  Select,
  Stack,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, FieldDateIcon } from "@parallel/chakra/icons";
import { FORMATS } from "@parallel/utils/dates";
import {
  addDays,
  addMonths,
  differenceInDays,
  differenceInMonths,
  endOfDay,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isEqual,
  isFuture,
  isPast,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";
import { CalendarMonth, CalendarMonthDateProps } from "./CalendarMonth";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

export type QuickRangeType = { type: "DAYS" | "MONTHS"; amount: number };

const ranges = [
  {
    amount: 7,
    type: "DAYS",
  },
  {
    amount: 30,
    type: "DAYS",
  },
  {
    amount: 3,
    type: "MONTHS",
  },
  {
    amount: 6,
    type: "MONTHS",
  },
  {
    amount: 12,
    type: "MONTHS",
  },
] as QuickRangeType[];

export function DateRangePicker({
  startDate = null,
  endDate = null,
  isPastAllowed,
  isFutureAllowed,
  onChange,
  onCancel,
}: {
  startDate: Date | null;
  endDate: Date | null;
  isPastAllowed?: boolean;
  isFutureAllowed?: boolean;
  onChange: (range: [Date, Date], quickRange: QuickRangeType | null) => void;
  onCancel?: () => void;
}) {
  const intl = useIntl();

  const [start, setStart] = useState(startDate || null);
  const [end, setEnd] = useState(endDate || null);
  const [rangeActive, setRangeActive] = useState<QuickRangeType | null>(null);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(startDate || new Date()));
  const month = getMonth(currentMonth);
  const year = getYear(currentMonth);
  const firstDayOfWeek = 1;
  const [isStartSelected, setIsStartSelected] = useState(startDate && !endDate ? false : true);

  useEffect(() => {
    setStart(startDate ? startOfDay(startDate) : startDate);
    setEnd(endDate ? endOfDay(endDate) : endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (start && end && isToday(end)) {
      const months = differenceInMonths(start, end) * -1;
      const days = differenceInDays(start, end) * -1;

      if ([3, 6, 12].includes(months)) {
        setRangeActive({ type: "MONTHS", amount: months });
      } else if ([7, 30].includes(days)) {
        setRangeActive({ type: "DAYS", amount: days });
      }
    } else {
      setRangeActive(null);
    }

    if (start) {
      setCurrentMonth(startOfMonth(start));
    }
  }, [start, end]);

  const handleQuickRangeClick = (range: QuickRangeType) => {
    setRangeActive(range);

    const startRangeDate =
      range.type === "DAYS"
        ? startOfDay(addDays(new Date(), -range.amount))
        : startOfDay(addMonths(new Date(), -range.amount));

    setStart(startRangeDate);
    setEnd(endOfDay(new Date()));
  };

  const handleApplyClick = () => {
    if (start && end) {
      onChange([start, end], rangeActive);
    }
  };

  const handleDateSelected = useCallback(
    function (date: Date) {
      if (start && end && isStartSelected) {
        // Reset the range, and set start date
        setEnd?.(null);
        setStart?.(startOfDay(date));
      } else {
        if (isStartSelected) {
          // If dont have range set the start date
          setStart?.(startOfDay(date));
        } else if (start && isBefore(date, start)) {
          // If the end date is before the start we flip it to make sense
          setEnd?.(endOfDay(start));
          setStart?.(startOfDay(date));
        } else {
          // if start is not selected sets the end, It doesn't matter if it has value or not
          setEnd?.(endOfDay(date));
        }
      }

      setCurrentMonth(startOfMonth(date));
      setIsStartSelected((current) => !current);
    },
    [isStartSelected, start, end, setStart, setEnd]
  );

  const wrapperProps = { paddingX: "4px", paddingY: "3px" } as BoxProps;

  const dateProps = useCallback<CalendarMonthDateProps>(
    ({ date, isNextMonth, isPrevMonth }) => {
      const defaultProps = {
        variant: "ghost",
        opacity: isNextMonth || isPrevMonth ? 0.4 : 1,
        textDecoration: isToday(date) ? "underline" : "none",
        isDisabled:
          ((!isPastAllowed && isPast(date) && !isToday(date)) ||
            (!isFutureAllowed && isFuture(date) && !isToday(date))) ??
          false,
      } as ButtonProps;

      if (start && !end) {
        return {
          ...defaultProps,
          ...(isEqual(date, start) ? { variant: "solid", colorScheme: "primary" } : {}),
        };
      } else if (start && end) {
        return {
          ...defaultProps,
          ...(isAfter(date, start) && isBefore(endOfDay(date), end)
            ? { variant: "solid", colorScheme: "primary", backgroundColor: "primary.300" }
            : isEqual(date, start) || isEqual(endOfDay(date), end)
            ? { variant: "solid", colorScheme: "primary" }
            : {}),
        };
      } else {
        return defaultProps;
      }
    },
    [start, end]
  );

  return (
    <Stack spacing={6} width="100%">
      <Flex direction="row" gridGap={4}>
        <Stack paddingTop={1} display={{ base: "none", md: "flex" }}>
          {ranges.map((range, index) => {
            const { amount, type } = range;
            const isActive = rangeActive && rangeActive.amount === amount;
            return (
              <Button
                key={index}
                display="box"
                textAlign="left"
                fontWeight="400"
                variant={isActive ? undefined : "ghost"}
                colorScheme={isActive ? "blue" : undefined}
                onClick={() => handleQuickRangeClick(range)}
              >
                {type === "DAYS" ? (
                  <FormattedMessage
                    id="generic.last-x-days"
                    defaultMessage="Last {days} days"
                    values={{
                      days: amount,
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="generic.last-x-months"
                    defaultMessage="Last {months} months"
                    values={{
                      months: amount,
                    }}
                  />
                )}
              </Button>
            );
          })}
        </Stack>
        <Stack spacing={0} gridGap={2} width="100%">
          <Select
            display={{ base: "block", md: "none" }}
            placeholder={intl.formatMessage({
              id: "component.date-range-picker.select-range",
              defaultMessage: "Select a predefined range",
            })}
            value={rangeActive ? `${rangeActive.amount}-${rangeActive.type}` : ""}
            onChange={(e) => {
              if (e.target.value) {
                const value = e.target.value.split("-");
                handleQuickRangeClick({
                  amount: Number(value[0]),
                  type: value[1] as "DAYS" | "MONTHS",
                });
              } else {
                setRangeActive(null);
                setStart(null);
                setEnd(null);
              }
            }}
            sx={{
              "&": { color: rangeActive === null ? "gray.400" : "inherit" },
              "& option": { color: "gray.800" },
              "& option[value='']": { color: "gray.400" },
            }}
          >
            {ranges.map((range, index) => {
              const { amount, type } = range;
              return (
                <option key={index} value={`${amount}-${type}`}>
                  {type === "DAYS"
                    ? intl.formatMessage(
                        {
                          id: "generic.last-x-days",
                          defaultMessage: "Last {days} days",
                        },
                        {
                          days: amount,
                        }
                      )
                    : intl.formatMessage(
                        {
                          id: "generic.last-x-months",
                          defaultMessage: "Last {months} months",
                        },
                        {
                          months: amount,
                        }
                      )}
                </option>
              );
            })}
          </Select>
          <HStack paddingY={1}>
            <Button
              size="sm"
              fontWeight="400"
              color={start ? undefined : "gray.400"}
              rightIcon={<FieldDateIcon />}
              variant="outline"
              onClick={() => setIsStartSelected(true)}
              outlineColor={isStartSelected ? "blue.500" : undefined}
              outline={isStartSelected ? "1px solid" : undefined}
              flex="1"
              justifyContent="space-between"
            >
              {start
                ? intl.formatDate(start, FORMATS.L)
                : intl.formatMessage({
                    id: "component.date-range-picker.date-placeholder",
                    defaultMessage: "mm-dd-aaaa",
                  })}
            </Button>
            <Button
              size="sm"
              fontWeight="400"
              color={end ? undefined : "gray.400"}
              rightIcon={<FieldDateIcon />}
              variant="outline"
              onClick={() => setIsStartSelected(false)}
              outlineColor={!isStartSelected ? "blue.500" : undefined}
              outline={!isStartSelected ? "1px solid" : undefined}
              flex="1"
              justifyContent="space-between"
            >
              {end
                ? intl.formatDate(end, FORMATS.L)
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
            wrapperProps={() => wrapperProps}
          />
        </Stack>
      </Flex>
      <Flex justifyContent="flex-end">
        <ButtonGroup>
          <Button onClick={onCancel}>
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
          <Button
            isDisabled={!start || !end || (isEqual(start, startDate!) && isEqual(end, endDate!))}
            colorScheme="primary"
            onClick={handleApplyClick}
          >
            <FormattedMessage id="generic.apply" defaultMessage="Apply" />
          </Button>
        </ButtonGroup>
      </Flex>
    </Stack>
  );
}
