import { Flex, HStack } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@parallel/chakra/icons";
import { ValueProps } from "@parallel/utils/ValueProps";
import { addMonths, subMonths } from "date-fns";
import { FormattedDate, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

interface CalendarMonthHeaderProps extends ValueProps<Date, false> {}

export function CalendarMonthHeader({ value, onChange }: CalendarMonthHeaderProps) {
  const intl = useIntl();
  return (
    <HStack>
      <IconButtonWithTooltip
        icon={<ChevronLeftIcon />}
        size="sm"
        label={intl.formatMessage({
          id: "component.calendar-month-header.prev-month",
          defaultMessage: "Previous month",
        })}
        onClick={() => onChange(subMonths(value, 1))}
      />
      <Flex flex="1" alignItems="center" justifyContent="center" fontWeight="bold">
        <FormattedDate value={value} month="long" year="numeric" />
      </Flex>
      <IconButtonWithTooltip
        icon={<ChevronRightIcon />}
        size="sm"
        label={intl.formatMessage({
          id: "component.calendar-month-header.next-month",
          defaultMessage: "Next month",
        })}
        onClick={() => onChange(addMonths(value, 1))}
      />
    </HStack>
  );
}
