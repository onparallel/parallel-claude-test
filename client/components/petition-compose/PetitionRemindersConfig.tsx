import {
  Box,
  BoxProps,
  Checkbox,
  Flex,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from "@chakra-ui/core";
import { RemindersConfig } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { Maybe } from "@parallel/utils/types";
import { useTimeInput } from "@parallel/utils/useTimeInput";
import {
  addDays,
  addWeeks,
  isWeekend,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { ChangeEvent, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { DateTime } from "../common/DateTime";

export function PetitionRemindersConfig({
  value,
  onChange,
  ...props
}: {
  value: Maybe<RemindersConfig>;
  onChange: (config: Maybe<RemindersConfig>) => void;
} & Omit<BoxProps, "onChange">) {
  let day = addDays(startOfToday(), value?.offset ?? 2);
  if (value?.weekdaysOnly && isWeekend(day)) {
    day = addWeeks(startOfWeek(day, { weekStartsOn: 1 }), 1);
  }
  const firstReminder = parse(value?.time ?? "09:00", "HH:mm", day);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeInput = useTimeInput(value?.time ?? "", {
    onChange: (time) => value && time && onChange({ ...value, timezone, time }),
  });

  const previousValue = useRef<RemindersConfig | null>(null);

  function handleEnableRemindersChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.checked) {
      onChange(
        previousValue.current ?? {
          offset: 2,
          time: "09:00",
          timezone,
          weekdaysOnly: false,
        }
      );
    } else {
      previousValue.current = {
        offset: value?.offset || 2,
        time: value?.time || "09:00",
        timezone: value?.timezone || timezone,
        weekdaysOnly: value?.weekdaysOnly || false,
      };
      onChange(null);
    }
  }

  return (
    <Box {...props}>
      <Flex alignItems="center">
        <Checkbox
          colorScheme="purple"
          size="lg"
          marginRight={2}
          isChecked={Boolean(value)}
          onChange={handleEnableRemindersChange}
        >
          <Text fontSize="md" as="span">
            <FormattedMessage
              id="petition.reminders-label"
              defaultMessage="Enable automatic reminders"
            />
          </Text>
        </Checkbox>
      </Flex>
      {value ? (
        <Box
          as="form"
          noValidate={true}
          paddingX={4}
          paddingY={2}
          marginTop={2}
          border="1px solid"
          borderColor="gray.300"
          borderRadius="md"
        >
          <Flex alignItems="center">
            <FormattedMessage
              id="component.petition-reminder-settings.text"
              defaultMessage="Send reminders every <days-input></days-input> days at <time-input></time-input>"
              values={{
                "days-input": () => (
                  <NumberInput
                    min={1}
                    max={99}
                    value={value.offset}
                    onChange={(_, offset) =>
                      onChange({
                        ...value,
                        timezone,
                        offset: Number.isInteger(offset) ? offset : 0,
                      })
                    }
                    size="sm"
                    width="64px"
                    marginX={2}
                    keepWithinRange
                    clampValueOnBlur
                  >
                    <NumberInputField type="number" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                ),
                "time-input": () => (
                  <Input
                    type="time"
                    size="sm"
                    width="120px"
                    marginX={2}
                    step={5 * 60}
                    {...timeInput}
                  />
                ),
              }}
            />
          </Flex>
          <Flex alignItems="center" marginTop={2}>
            <Checkbox
              id="reminder-settings-weekdays"
              colorScheme="purple"
              size="md"
              marginRight={2}
              isChecked={value.weekdaysOnly}
              onChange={(event) =>
                onChange({
                  ...value,
                  timezone,
                  weekdaysOnly: event.target.checked,
                })
              }
            />
            <Box as="label" htmlFor="reminder-settings-weekdays">
              <FormattedMessage
                id="component.petition-reminder-settings.only-weekdays"
                defaultMessage="...only on weekdays"
              />
            </Box>
          </Flex>

          <Text fontSize="sm" fontStyle="italic" marginTop={1}>
            <Box as="span">*</Box>
            <FormattedMessage
              id="component.petition-reminder-settings.next-reminder"
              defaultMessage="After sending the petition, the first reminder will be sent on {date} and up to 10 reminders will be sent {days, plural, =1 {everyday} other {every # days}} at {time} until the petition is completed."
              values={{
                date: <DateTime value={firstReminder} format={FORMATS.LL} />,
                days: value.offset,
                time: value.time,
              }}
            />
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
