import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  addHours,
  addWeeks,
  isFuture,
  isPast,
  isWeekend,
  parse,
  roundToNearestMinutes,
  startOfToday,
  startOfTomorrow,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { DateTimePicker } from "../common/DateTimePicker";

export function ScheduleMessageDialog({ ...props }: DialogProps<{}, Date>) {
  const [date, setDate] = useState<Date>(
    roundToNearestMinutes(addHours(new Date(), 1), { nearestTo: 5 })
  );

  const suggestions = useMemo(
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
        <DateTimePicker
          value={date}
          onChange={setDate}
          suggestions={suggestions}
        />
      }
      confirm={
        <Button
          colorScheme="purple"
          isDisabled={!date || isPast(date)}
          onClick={() => props.onResolve(date)}
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
