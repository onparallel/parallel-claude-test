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
