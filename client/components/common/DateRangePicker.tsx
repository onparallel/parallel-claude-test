import { Select } from "@parallel/chakra/components";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { Box, Button, HStack, Stack } from "@parallel/components/ui";
import { FORMATS } from "@parallel/utils/dates";
import { ValueProps } from "@parallel/utils/ValueProps";
import {
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
} from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import {
  CalendarMonth,
  CalendarMonthDateProps,
  CalendarMonthDateWrapperProps,
} from "./CalendarMonth";
import { CalendarMonthHeader } from "./CalendarMonthHeader";
import { DateRange, isEqualDateRange, useQuickDateRanges } from "./useQuickDateRanges";

function isBeforeOrEqual(date: Date, dateToCompare: Date) {
  return isBefore(date, dateToCompare) || isEqual(date, dateToCompare);
}

function isAfterOrEqual(date: Date, dateToCompare: Date) {
  return isAfter(date, dateToCompare) || isEqual(date, dateToCompare);
}

export interface DateRangePickerProps extends ValueProps<DateRange<true>, false> {
  isPastAllowed?: boolean;
  isFutureAllowed?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  isPastAllowed = true,
  isFutureAllowed = true,
}: DateRangePickerProps) {
  const intl = useIntl();

  const [startDate, endDate] = value;
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(value[0] ?? new Date()));
  const [edgeSelection, setEdgeSelection] = useState<"START" | "END">("START");
  const month = getMonth(currentMonth);
  const year = getYear(currentMonth);
  const firstDayOfWeek = 1;
  const quickRanges = useQuickDateRanges();
  const activeRange = useMemo(() => {
    return isNonNullish(startDate) && isNonNullish(endDate)
      ? (quickRanges.find(({ range }) => isEqualDateRange([startDate, endDate], range)) ?? null)
      : null;
  }, [startDate?.valueOf(), endDate?.valueOf(), quickRanges]);

  function setQuickRange(range: DateRange) {
    onChange(range);
    setCurrentMonth(startOfMonth(range[0]));
  }

  const handleDateClick = useCallback(
    function (date: Date) {
      if (edgeSelection === "START") {
        onChange([
          startOfDay(date),
          isNonNullish(endDate) && isBefore(endDate, startOfDay(date)) ? null : endDate,
        ]);
        setEdgeSelection("END");
      } else {
        onChange([
          isNonNullish(startDate) && isAfter(startDate, endOfDay(date)) ? null : startDate,
          endOfDay(date),
        ]);
        setEdgeSelection("START");
      }
    },
    [edgeSelection, startDate?.valueOf(), endDate?.valueOf()],
  );

  const dateProps = useCallback<CalendarMonthDateProps>(
    ({ date, isNextMonth, isPrevMonth }) => {
      return {
        zIndex: 3,
        _focus: { zIndex: 3 },
        position: "initial",
        opacity: isNextMonth || isPrevMonth ? 0.4 : 1,
        textDecoration: isToday(date) ? "underline" : "none",
        isDisabled:
          ((!isPastAllowed && isPast(date) && !isToday(date)) ||
            (!isFutureAllowed && isFuture(date) && !isToday(date))) ??
          false,
        ...((isNonNullish(startDate) && isEqual(date, startDate)) ||
        (isNonNullish(endDate) && isEqual(endOfDay(date), endDate))
          ? { variant: "solid", colorScheme: "primary" }
          : isNonNullish(startDate) &&
              isNonNullish(endDate) &&
              isAfter(date, startDate) &&
              isBefore(endOfDay(date), endDate)
            ? {
                variant: "ghost",
                backgroundColor: "primary.100",
                _hover: { backgroundColor: "primary.300" },
              }
            : { variant: "ghost" }),
        // Make button fill entire cell so it's easier to select
        _after: {
          content: "''",
          position: "absolute",
          width: "100%",
          height: "100%",
        },
      };
    },
    [startDate?.valueOf(), endDate?.valueOf()],
  );

  const wrapperProps = useCallback<CalendarMonthDateWrapperProps>(
    ({ date }) => {
      return {
        position: "relative",
        sx: {
          ...(isNonNullish(startDate) &&
          isNonNullish(endDate) &&
          isAfterOrEqual(date, startDate) &&
          isBeforeOrEqual(endOfDay(date), endDate)
            ? {
                _after: {
                  zIndex: 2,
                  content: "''",
                  position: "absolute",
                  height: "100%",
                  background: "primary.100",
                  ...(isEqual(date, startDate) && isEqual(endOfDay(date), endDate)
                    ? {}
                    : isEqual(date, startDate)
                      ? { insetEnd: 0, width: "calc(50% + 16px)", borderStartRadius: "full" }
                      : isEqual(endOfDay(date), endDate)
                        ? { insetStart: 0, width: "calc(50% + 16px)", borderEndRadius: "full" }
                        : isAfter(date, startDate) && isBefore(date, endDate)
                          ? { width: "100%" }
                          : {}),
                },
              }
            : {}),
          ...(isNonNullish(hoveredDate) &&
          // selecting END and date is range [endDate ?? startDate, hoveredDate]
          ((isNonNullish(startDate) &&
            isBeforeOrEqual(date, hoveredDate) &&
            edgeSelection === "END" &&
            (isNonNullish(endDate)
              ? isAfterOrEqual(endOfDay(date), endDate)
              : isAfterOrEqual(date, startDate))) ||
            // selecting START and date is range [hoveredDate, startDate ?? endDate]
            (isNonNullish(endDate) &&
              edgeSelection === "START" &&
              isAfterOrEqual(date, hoveredDate) &&
              (isNonNullish(startDate)
                ? isBeforeOrEqual(date, startDate)
                : isBeforeOrEqual(endOfDay(date), endDate))))
            ? {
                _before: {
                  zIndex: 1,
                  content: "''",
                  position: "absolute",
                  height: "100%",
                  borderColor: "gray.100",
                  borderStyle: "dashed",
                  ...// if hovering opposite edge, don't show
                  (isEqual(date, hoveredDate) &&
                  ((edgeSelection === "START" &&
                    (isNonNullish(startDate)
                      ? isEqual(date, startDate)
                      : isEqual(endOfDay(date), endDate!))) ||
                    (edgeSelection === "END" &&
                      (isNonNullish(endDate)
                        ? isEqual(endOfDay(date), endDate)
                        : isEqual(date, startDate!))))
                    ? {}
                    : isEqual(date, hoveredDate)
                      ? // date is the hoveredDate
                        {
                          width: "calc(50% + 16px)",
                          borderBlockWidth: "2px",
                          ...(edgeSelection === "START"
                            ? { insetEnd: 0, borderStartRadius: "full", borderStartWidth: "2px" }
                            : { insetStart: 0, borderEndRadius: "full", borderEndWidth: "2px" }),
                        }
                      : edgeSelection === "START" && isEqual(endOfDay(date), endDate!)
                        ? // date is endDate and hovering after it
                          { width: "50%", insetStart: 0, borderBlockWidth: "2px" }
                        : edgeSelection === "END" && isEqual(date, startDate!)
                          ? // date is startDate and hovering before it it
                            { width: "50%", insetEnd: 0, borderBlockWidth: "2px" }
                          : { width: "100%", borderBlockWidth: "2px" }),
                },
              }
            : {}),
        },
      };
    },
    [startDate?.valueOf(), endDate?.valueOf(), hoveredDate?.valueOf(), edgeSelection],
  );

  return (
    <Stack gap={6} width="100%">
      <Stack direction={{ base: "column", md: "row" }} gap={{ base: 2, md: 4 }}>
        <Box>
          <Stack display={{ base: "none", md: "flex" }}>
            {quickRanges.map(({ key, range, text }) => {
              const isActive = isNonNullish(activeRange) && activeRange.key === key;
              return (
                <Button
                  key={key}
                  display="box"
                  textAlign="left"
                  fontWeight="400"
                  variant={isActive ? undefined : "ghost"}
                  colorPalette={isActive ? "blue" : undefined}
                  onClick={() => setQuickRange(range)}
                >
                  {text}
                </Button>
              );
            })}
          </Stack>
          <Select
            display={{ base: "block", md: "none" }}
            placeholder={intl.formatMessage({
              id: "component.date-range-picker.select-range",
              defaultMessage: "Select a predefined range",
            })}
            value={activeRange?.key ?? ""}
            onChange={(e) => {
              if (e.target.value) {
                setQuickRange(quickRanges.find(({ key }) => key === e.target.value)!.range);
              }
            }}
            sx={{
              "&": { color: isNullish(activeRange) ? "gray.400" : "inherit" },
              "& option": { color: "gray.800" },
              "& option[value='']": { color: "gray.400" },
            }}
          >
            {quickRanges.map(({ key, text }) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </Select>
        </Box>
        <Stack gap={3} flex={1}>
          <HStack>
            <Button
              size="sm"
              fontWeight="400"
              color={startDate ? undefined : "gray.400"}
              rightIcon={<FieldDateIcon />}
              variant="outline"
              onClick={() => {
                setEdgeSelection("START");
                if (isNonNullish(startDate)) {
                  setCurrentMonth(startOfMonth(startDate));
                }
              }}
              outlineColor={edgeSelection === "START" ? "blue.500" : undefined}
              outline={edgeSelection === "START" ? "1px solid" : undefined}
              flex="1"
              justifyContent="space-between"
            >
              {isNonNullish(startDate)
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
              onClick={() => {
                setEdgeSelection("END");
                if (isNonNullish(endDate)) {
                  setCurrentMonth(startOfMonth(endDate));
                }
              }}
              outlineColor={edgeSelection === "END" ? "blue.500" : undefined}
              outline={edgeSelection === "END" ? "1px solid" : undefined}
              flex="1"
              justifyContent="space-between"
            >
              {isNonNullish(endDate)
                ? intl.formatDate(endDate, FORMATS.L)
                : intl.formatMessage({
                    id: "component.date-range-picker.date-placeholder",
                    defaultMessage: "mm-dd-aaaa",
                  })}
            </Button>
          </HStack>
          <CalendarMonthHeader value={currentMonth} onChange={(value) => setCurrentMonth(value)} />
          <CalendarMonth
            year={year}
            month={month}
            firstDayOfWeek={firstDayOfWeek}
            onDateClick={handleDateClick}
            onDateHover={(date) => setHoveredDate(date)}
            dateProps={dateProps}
            wrapperProps={wrapperProps}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
