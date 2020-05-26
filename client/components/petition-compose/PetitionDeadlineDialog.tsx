import { Box, Button, Flex, Input } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FORMATS } from "@parallel/utils/dates";
import {
  addDays,
  format,
  isEqual,
  isFuture,
  isPast,
  isToday,
  isTomorrow,
  parse,
  startOfDay,
  subMinutes,
} from "date-fns";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedDate, FormattedMessage, FormattedTime } from "react-intl";
import { DatePicker } from "../common/DatePicker";

export function PetitionDeadlineDialog({ ...props }: DialogProps<Date>) {
  const nextWeek = startOfDay(addDays(new Date(), 7));
  const [date, setDate] = useState<Date>(nextWeek);
  const [time, setTime] = useState<Date>(subMinutes(addDays(nextWeek, 1), 1));

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
      ["17:00", "18:00", "23:59"].map((hours) => {
        const alternativeSameDay = parse(hours, "HH:mm", date);
        return isFuture(alternativeSameDay)
          ? alternativeSameDay
          : parse(hours, "HH:mm", addDays(date, 1));
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
            id="petition.set-deadline"
            defaultMessage="Set deadline"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function usePetitionDeadlineDialog() {
  return useDialog(PetitionDeadlineDialog);
}
