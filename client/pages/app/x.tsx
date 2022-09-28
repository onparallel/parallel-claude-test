import { Box } from "@chakra-ui/react";
import {
  CalendarMonth,
  CalendarMonthDateProps,
  CalendarMonthDateWrapperProps,
} from "@parallel/components/common/CalendarMonth";
import { DatePicker } from "@parallel/components/common/DatePicker";
import { addDays, isBefore, isEqual, startOfDay } from "date-fns";
import { useCallback, useState } from "react";

export default function () {
  const [[startDate, endDate], setRange] = useState([
    startOfDay(addDays(new Date(), -5)),
    startOfDay(new Date()),
  ]);
  const wrapperProps = useCallback<CalendarMonthDateWrapperProps>(
    ({ date }) => {
      return {
        ...(isBefore(date, startDate)
          ? {}
          : isEqual(date, startDate)
          ? {
              borderLeftRadius: "full",
              marginLeft: "2px",
              paddingRight: "2px",
              backgroundColor: "primary.300",
            }
          : isBefore(date, endDate)
          ? { paddingX: "2px", backgroundColor: "primary.300" }
          : isEqual(date, endDate)
          ? { borderRightRadius: "full", marginRight: "2px", paddingLeft: "2px", width: "34px" }
          : { borderRadius: "full", marginX: "2px" }),
      };
    },
    [startDate, endDate]
  );
  const dateProps = useCallback<CalendarMonthDateProps>(
    ({ date, isNextMonth, isPrevMonth }) => {
      return {
        ...(isBefore(date, startDate)
          ? { variant: "ghost" }
          : isEqual(date, startDate)
          ? { variant: "solid", colorScheme: "primary" }
          : isBefore(date, endDate)
          ? { variant: "solid", colorScheme: "primary", backgroundColor: "primary.300" }
          : isEqual(date, endDate)
          ? { variant: "solid", colorScheme: "primary" }
          : { variant: "ghost" }),
        opacity: isNextMonth || isPrevMonth ? 0.4 : 1,
      };
    },
    [startDate, endDate]
  );
  return (
    <Box>
      <Box display="flex">
        <Box flex="0 1 0%">
          <CalendarMonth
            month={8}
            year={2022}
            firstDayOfWeek={1}
            wrapperProps={wrapperProps}
            dateProps={dateProps}
          />
        </Box>
      </Box>
      <Box>
        <Box display="flex">
          <Box flex="0 1 0%">
            <DatePicker
              value={startDate}
              isPastAllowed
              onChange={(value) => setRange(([currStartDate, currEndDate]) => [value, currEndDate])}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
