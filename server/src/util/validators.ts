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

export function isInRange(value: number, min?: number, max?: number) {
  if ((min !== undefined && min > value) || (max !== undefined && max < value)) return false;
  return true;
}
