import { filter, indexBy, mapValues, pipe } from "remeda";

export type DateTimeFormatOptions = Exclude<Intl.DateTimeFormatOptions, "localeMatcher">;

/**
 * Prebuilt DateTimeFormatOptions to use with react-intl
 */
export const FORMATS = (() => {
  const formats = {
    /**
     * E.g. 05/03/2020
     */
    L: {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    },
    /**
     * E.g. 05/03/2020 14:16
     */
    "L+LT": {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    },
    /**
     * E.g. 05/03/2020 14:16:00
     */
    "L+LTS": {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    },
    /**
     * E.g. March 5, 2020
     */
    LL: {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    /**
     * E.g. Mar 5, 2020
     */
    ll: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
    /**
     * E.g. March 2020
     */
    YYYMM: {
      month: "long",
      year: "numeric",
    },
    /**
     * E.g. March 5
     */
    MMMdd: {
      day: "numeric",
      month: "long",
    },
    /**
     * E.g. 14:16
     */
    LT: {
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    },
    /**
     * E.g. 14:16:00
     */
    LTS: {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    },
    /**
     * E.g. March 5, 2020, 14:16
     */
    LLL: {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    },
    /**
     * E.g. March 5, 2020, 14:16:39
     */
    FULL: {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    },
  };
  return formats as Record<keyof typeof formats, DateTimeFormatOptions>;
})();

export function prettifyTimezone(timezone: string) {
  return timezone.replaceAll("_", " ");
}

export function dateToDatetimeLocal(date: string | number | Date) {
  const { year, month, day, hour, minute, second } = pipe(
    new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      second: "2-digit",
    }).formatToParts(new Date(date)),
    filter((p) => p.type !== "literal"),
    indexBy((p) => p.type),
    mapValues((p) => p.value),
  );
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function dateToFilenameFormat(date: string | number | Date) {
  const { year, month, day } = pipe(
    new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(new Date(date)),
    filter((p) => p.type !== "literal"),
    indexBy((p) => p.type),
    mapValues((p) => p.value),
  );
  return `${year}${month}${day}`;
}
