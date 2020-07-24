import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import {
  addDays,
  addWeeks,
  isFuture,
  isPast,
  parse,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { DateTimePicker } from "../common/DateTimePicker";

export function PetitionDeadlineDialog({ ...props }: DialogProps<Date>) {
  // next friday at 18:00
  const defaultDeadline = parse(
    "18:00",
    "HH:mm",
    addDays(
      startOfWeek(addWeeks(new Date(), 1), {
        weekStartsOn: 0,
      }),
      5
    )
  );
  const [date, setDate] = useState<Date>(defaultDeadline);

  const suggestions = useMemo(
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
