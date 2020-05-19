import { Box, Button, Flex, Input } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FORMATS } from "@parallel/utils/dates";
import {
  addHours,
  addWeeks,
  format,
  isEqual,
  isFuture,
  isPast,
  isToday,
  isTomorrow,
  isWeekend,
  parse,
  roundToNearestMinutes,
  startOfDay,
  startOfToday,
  startOfTomorrow,
  startOfWeek,
} from "date-fns";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedDate, FormattedMessage, FormattedTime } from "react-intl";
import { DatePicker } from "../common/DatePicker";

export function ScheduleMessageDialog({ ...props }: DialogCallbacks<Date>) {
  const [date, setDate] = useState<Date>(startOfDay(addHours(new Date(), 1)));
  const [time, setTime] = useState<Date>(
    roundToNearestMinutes(addHours(new Date(), 1), { nearestTo: 5 })
  );

  const result = useMemo(
    () =>
      parse(
        `${format(date, "yyyy-MM-dd")} ${format(time, "HH:mm")}`,
        "yyyy-MM-dd HH:mm",
        startOfDay(new Date())
      ),
    [date, time]
  );

  const isDisabledDate = useCallback(
    (date: Date) => isPast(date) && !isToday(date),
    []
  );
  const handleDateInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value) {
        setDate(
          parse(event.target.value, "yyyy-MM-dd", startOfDay(new Date()))
        );
      }
    },
    []
  );
  const handleTimeInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value) {
        setTime(parse(event.target.value, "HH:mm", date));
      }
    },
    []
  );

  const alternatives = useMemo(
    () =>
      ["08:00", "09:00", "18:00"].map((hours) => {
        const today = startOfToday();
        const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
        const tomorrowOrNextMonday = isWeekend(startOfTomorrow())
          ? nextMonday
          : startOfTomorrow();
        return isWeekend(today)
          ? parse(hours, "HH:mm", nextMonday)
          : isFuture(parse(hours, "HH:mm", today))
          ? parse(hours, "HH:mm", today)
          : parse(hours, "HH:mm", tomorrowOrNextMonday);
      }),
    [date]
  );

  return (
    <ConfirmDialog
      size="xl"
      content={{
        as: "form",
        ...{ noValidate: true },
      }}
      header={
        <FormattedMessage
          id="petition.schedule-delivery.header"
          defaultMessage="Select date and time"
        />
      }
      body={
        <Flex>
          <Box display={{ base: "none", sm: "block" }}>
            <DatePicker
              value={date}
              onChange={setDate}
              isDateDisabled={isDisabledDate}
            />
          </Box>
          <Flex flex="1" direction="column" marginLeft={{ base: 0, sm: 4 }}>
            <Flex direction={{ base: "row", sm: "column" }}>
              <Input
                type="date"
                value={format(date, "yyyy-MM-dd")}
                onChange={handleDateInputChange}
              />
              <Input
                marginTop={{ base: 0, sm: 2 }}
                marginLeft={{ base: 4, sm: 0 }}
                type="time"
                step={60 * 5}
                value={format(time, "HH:mm")}
                onChange={handleTimeInputChange}
              />
            </Flex>
            {alternatives.map((date, index) => (
              <Button
                marginTop={2}
                key={index}
                variantColor={isEqual(date, result) ? "purple" : "gray"}
                onClick={() => {
                  setTime(date);
                  setDate(date);
                }}
              >
                {isToday(date) ? (
                  <FormattedMessage
                    id="generic.today-at"
                    defaultMessage="Today at {time}"
                    values={{
                      time: <FormattedTime value={date} hour12={false} />,
                    }}
                  />
                ) : isTomorrow(date) ? (
                  <FormattedMessage
                    id="generic.tomorrow-at"
                    defaultMessage="Tomorrow at {time}"
                    values={{
                      time: <FormattedTime value={date} hour12={false} />,
                    }}
                  />
                ) : (
                  <FormattedDate
                    value={date}
                    weekday="short"
                    {...FORMATS.LLL}
                  />
                )}
              </Button>
            ))}
          </Flex>
        </Flex>
      }
      confirm={
        <Button
          variantColor="purple"
          isDisabled={!result || isPast(result)}
          onClick={() => props.onResolve(result)}
        >
          <FormattedMessage
            id="petition.schedule-send-button"
            defaultMessage="Schedule send"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useScheduleMessageDialog() {
  return useDialog(ScheduleMessageDialog);
}
