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
import { FORMATS } from "@parallel/utils/dates";
import { Maybe } from "@parallel/utils/types";
import {
  addDays,
  addWeeks,
  isWeekend,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { ChangeEvent } from "react";
import { FormattedMessage } from "react-intl";
import { DateTime } from "../common/DateTime";

export type RemindersConfig = {
  offset: number;
  time: string;
  timezone: string;
  weekdaysOnly: boolean;
};

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

  function handleEnableRemindersChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(
      event.target.checked
        ? {
            offset: 2,
            time: "09:00",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            weekdaysOnly: false,
          }
        : null
    );
  }
  return (
    <Box {...props}>
      <Flex alignItems="center">
        <Checkbox
          variantColor="purple"
          size="lg"
          marginRight={2}
          isChecked={value !== null}
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
          {...{ noValidate: true }}
          paddingX={4}
          paddingY={2}
          marginTop={2}
          border="1px solid"
          borderColor="gray.300"
          rounded="md"
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
                    onChange={(offset) =>
                      onChange({
                        ...value,
                        timezone,
                        offset: offset as number,
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
                    value={value.time}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      event.target.value &&
                      onChange({
                        ...value,
                        timezone,
                        time: event.target.value,
                      })
                    }
                  />
                ),
              }}
            />
          </Flex>
          <Flex alignItems="center" marginTop={2}>
            <Checkbox
              id="reminder-settings-weekdays"
              variantColor="purple"
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
            <Text as="label" {...{ htmlFor: "reminder-settings-weekdays" }}>
              <FormattedMessage
                id="component.petition-reminder-settings.only-weekdays"
                defaultMessage="...only on weekdays"
              />
            </Text>
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
