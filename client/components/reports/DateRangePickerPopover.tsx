import { FocusLock } from "@chakra-ui/focus-lock";
import {
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverProps,
  PopoverTrigger,
  Stack,
} from "@chakra-ui/react";
import { CloseIcon, FieldDateIcon } from "@parallel/chakra/icons";
import { addDays, addMonths, isEqual, startOfDay } from "date-fns";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { DateRangePicker } from "../common/DateRangePicker";

export function DateRangePickerPopover({
  startDate = null,
  endDate = null,
  onChange,
  onRemoveFilter,
  isDisabled,
  ...props
}: {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (range: [Date, Date]) => void;
  onRemoveFilter: () => void;
  isDisabled?: boolean;
} & PopoverProps) {
  const intl = useIntl();
  const [[start, end], setRange] = useState<[Date | null, Date | null]>([startDate, endDate]);
  const [rangeActive, setRangeActive] = useState<[number, "DAYS" | "MONTHS"] | null>(null);
  const [rangeApplied, setRangeApplied] = useState<[number, "DAYS" | "MONTHS"] | null>(null);

  const setQuickRange = (range: [number, "DAYS" | "MONTHS"]) => {
    setRangeActive(range);
    if (range[1] === "DAYS") {
      setRange([startOfDay(addDays(new Date(), -range[0])), startOfDay(new Date())]);
    } else {
      setRange([startOfDay(addMonths(new Date(), -range[0])), startOfDay(new Date())]);
    }
  };

  const handleStartChange = (date: Date | null) => {
    setRange(([_, currEndDate]) => [date, currEndDate]);
    setRangeActive(null);
  };

  const handleEndChande = (date: Date | null) => {
    setRange(([currStartDate, _]) => [currStartDate, date]);
    setRangeActive(null);
  };

  const handleRemoveFilter = () => {
    setRange([null, null]);
    setRangeActive(null);
    setRangeApplied(null);
    onRemoveFilter();
  };

  const ranges = [
    {
      number: 7,
      type: "DAYS",
    },
    {
      number: 30,
      type: "DAYS",
    },
    {
      number: 3,
      type: "MONTHS",
    },
    {
      number: 6,
      type: "MONTHS",
    },
    {
      number: 12,
      type: "MONTHS",
    },
  ] as { number: number; type: "DAYS" | "MONTHS" }[];

  let buttonText = intl.formatMessage({
    id: "page.reports.any-date",
    defaultMessage: "Any date",
  });

  if (rangeApplied && startDate && endDate) {
    if (rangeApplied[1] === "DAYS") {
      buttonText = intl.formatMessage(
        {
          id: "generic.last-x-days",
          defaultMessage: "Last {days} days",
        },
        {
          days: rangeApplied[0],
        }
      );
    } else {
      buttonText = intl.formatMessage(
        {
          id: "generic.last-x-months",
          defaultMessage: "Last {months} months",
        },
        {
          months: rangeApplied[0],
        }
      );
    }
  } else if (startDate && endDate) {
    buttonText = `${intl.formatDate(startDate, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })} - ${intl.formatDate(endDate, { day: "numeric", month: "short", year: "numeric" })}`;
  }

  return isDisabled ? (
    <>
      <Button
        leftIcon={<FieldDateIcon position="relative" top="-1px" />}
        color={startDate && endDate ? "purple.600" : undefined}
        fontWeight={startDate && endDate ? "600" : "500"}
      >
        {buttonText}
      </Button>
    </>
  ) : (
    <ButtonGroup isAttached>
      <Popover closeOnBlur={false} placement="bottom-start" {...props}>
        {({ onClose }) => (
          <>
            <PopoverTrigger>
              <Button
                leftIcon={<FieldDateIcon position="relative" top="-1px" />}
                color={startDate && endDate ? "purple.600" : undefined}
                fontWeight={startDate && endDate ? "600" : "500"}
              >
                {buttonText}
              </Button>
            </PopoverTrigger>
            <PopoverContent width="max-content" padding={4} paddingX={6}>
              <FocusLock restoreFocus>
                <PopoverHeader border="none" as="h2" fontSize="xl" fontWeight="600" padding={0}>
                  <FormattedMessage
                    id="component.date-range-picker-popover.title"
                    defaultMessage="Select a range of dates"
                  />
                </PopoverHeader>
                <PopoverBody paddingX={0} paddingY={4}>
                  <Flex direction="row" gridGap={4}>
                    <Stack paddingTop={1}>
                      {ranges.map((range, index) => {
                        const { number, type } = range;
                        const isActive = rangeActive && rangeActive[0] === number;
                        return (
                          <Button
                            key={index}
                            display="box"
                            textAlign="left"
                            fontWeight="400"
                            variant={isActive ? undefined : "ghost"}
                            colorScheme={isActive ? "purple" : undefined}
                            onClick={() => setQuickRange([number, type])}
                          >
                            {type === "DAYS" ? (
                              <FormattedMessage
                                id="generic.last-x-days"
                                defaultMessage="Last {days} days"
                                values={{
                                  days: number,
                                }}
                              />
                            ) : (
                              <FormattedMessage
                                id="generic.last-x-months"
                                defaultMessage="Last {months} months"
                                values={{
                                  months: number,
                                }}
                              />
                            )}
                          </Button>
                        );
                      })}
                    </Stack>
                    <DateRangePicker
                      startDate={start}
                      endDate={end}
                      isPastAllowed
                      isFutureAllowed={false}
                      onStartChange={handleStartChange}
                      onEndChange={handleEndChande}
                    />
                  </Flex>
                </PopoverBody>
                <PopoverFooter border="none" display="flex" justifyContent="flex-end" padding={0}>
                  <ButtonGroup>
                    <Button onClick={onClose}>
                      <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
                    </Button>
                    <Button
                      isDisabled={
                        !start || !end || (isEqual(start, startDate!) && isEqual(end, endDate!))
                      }
                      colorScheme="primary"
                      onClick={() => {
                        setRangeApplied(rangeActive);
                        onChange([start!, end!]);
                        onClose();
                      }}
                    >
                      <FormattedMessage id="generic.apply" defaultMessage="Apply" />
                    </Button>
                  </ButtonGroup>
                </PopoverFooter>
              </FocusLock>
            </PopoverContent>
          </>
        )}
      </Popover>
      {startDate && endDate ? (
        <IconButton
          aria-label="Remove filter"
          icon={<CloseIcon fontSize={12} />}
          onClick={handleRemoveFilter}
        />
      ) : null}
    </ButtonGroup>
  );
}
