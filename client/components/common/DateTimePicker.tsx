import { Box, Button, Flex, Input } from "@chakra-ui/core";
import { FORMATS } from "@parallel/utils/dates";
import { format, isEqual, isToday, isTomorrow, parse } from "date-fns";
import { ChangeEvent } from "react";
import { FormattedDate, FormattedMessage, FormattedTime } from "react-intl";
import { DatePicker } from "./DatePicker";
import { useTimeInput } from "@parallel/utils/useTimeInput";

export function DateTimePicker({
  value,
  onChange,
  suggestions,
  isDisabledDate = () => false,
  isPastAllowed,
}: {
  value: Date;
  onChange: (value: Date) => void;
  suggestions: Date[];
  isPastAllowed?: boolean;
  isDisabledDate?: (date: Date) => boolean;
}) {
  const timeInput = useTimeInput(format(value, "HH:mm"), {
    onChange: (time) => time && onChange(parse(time, "HH:mm", value)),
  });
  return (
    <Flex>
      <Box display={{ base: "none", sm: "block" }}>
        <DatePicker
          value={value}
          onChange={(date) => {
            onChange(
              parse(
                `${format(date, "yyyy-MM-dd")} ${format(value, "HH:mm")}`,
                "yyyy-MM-dd HH:mm",
                new Date()
              )
            );
          }}
          isPastAllowed={isPastAllowed}
          isDisabledDate={isDisabledDate}
        />
      </Box>
      <Flex flex="1" direction="column" marginLeft={{ base: 0, sm: 4 }}>
        <Flex direction={{ base: "row", sm: "column" }}>
          <Input
            type="date"
            value={format(value, "yyyy-MM-dd")}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              if (event.target.value) {
                onChange(
                  parse(
                    `${event.target.value} ${format(value, "HH:mm")}`,
                    "yyyy-MM-dd HH:mm",
                    new Date()
                  )
                );
              }
            }}
          />
          <Input
            marginTop={{ base: 0, sm: 2 }}
            marginLeft={{ base: 4, sm: 0 }}
            type="time"
            {...timeInput}
          />
        </Flex>
        {suggestions.map((date) => (
          <Button
            marginTop={2}
            key={date.valueOf()}
            colorScheme={isEqual(date, value) ? "purple" : "gray"}
            onClick={() => onChange(date)}
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
              <FormattedDate value={date} weekday="short" {...FORMATS.LLL} />
            )}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
