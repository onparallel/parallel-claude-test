import { parse, addDays, isWeekend, startOfToday } from "date-fns";
import { format, utcToZonedTime, toDate } from "date-fns-tz";

export function calculateNextReminder(
  fromDate: Date,
  offset: number,
  time: string,
  timezone: string,
  weekDaysOnly: boolean
) {
  // Calculate next reminder
  const sendDate = fromDate;
  const date = parse(
    format(utcToZonedTime(sendDate, timezone), "yyyy-MM-dd", {
      timeZone: timezone,
    }),
    "yyyy-MM-dd",
    startOfToday()
  );
  let reminderDate = addDays(date, offset);
  while (weekDaysOnly && isWeekend(reminderDate)) {
    reminderDate = addDays(reminderDate, 1);
  }
  return toDate(`${format(reminderDate, "yyyy-MM-dd")}T${time}:00`, {
    timeZone: timezone,
  });
}
