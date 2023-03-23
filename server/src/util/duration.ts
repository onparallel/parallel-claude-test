import type { Duration } from "date-fns";

const KEYS = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];

export function addDuration(d1: Duration, d2: Duration) {
  const newDuration: Duration = {};
  KEYS.forEach((key) => {
    const dKey = key as keyof Duration;
    newDuration[dKey] = (d1[dKey] ?? 0) + (d2[dKey] ?? 0);
  });
  return newDuration;
}

export function multiplyDuration(duration: Duration, multiplier: number) {
  const newDuration: Duration = {};
  Object.entries(duration).forEach(([unit, value]) => {
    newDuration[unit as keyof Duration] = value * multiplier;
  });
  return newDuration;
}
