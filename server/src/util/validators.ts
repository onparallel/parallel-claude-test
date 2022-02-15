import { findTimeZone } from "timezone-support";

export function isValidTimezone(timezone: string) {
  try {
    findTimeZone(timezone);
    return true;
  } catch {
    return false;
  }
}

export function isValidTime(time: string) {
  return /(2[0-3]|[01][0-9]):([0-5][0-9])/.test(time);
}

export function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
}
