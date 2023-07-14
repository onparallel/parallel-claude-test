import { addDays, isWeekend, parse, startOfToday } from "date-fns";
import { format, formatInTimeZone, toDate } from "date-fns-tz";

export interface PetitionAccessReminderConfig {
  offset: number;
  limit?: number;
  time: string;
  timezone: string;
  weekdaysOnly: boolean;
}

export function calculateNextReminder(fromDate: Date, config: PetitionAccessReminderConfig) {
  // Calculate next reminder
  const sendDate = fromDate;
  const date = parse(
    formatInTimeZone(sendDate, config.timezone, "yyyy-MM-dd"),
    "yyyy-MM-dd",
    startOfToday(),
  );
  let reminderDate = addDays(date, config.offset);
  while (config.weekdaysOnly && isWeekend(reminderDate)) {
    reminderDate = addDays(reminderDate, 1);
  }
  return toDate(`${format(reminderDate, "yyyy-MM-dd")}T${config.time}:00`, {
    timeZone: config.timezone,
  });
}
