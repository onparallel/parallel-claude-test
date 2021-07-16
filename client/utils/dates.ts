export type DateTimeFormatOptions = Exclude<
  Intl.DateTimeFormatOptions,
  "localeMatcher"
>;

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
     * E.g. March 5, 2020
     */
    LL: {
      day: "numeric",
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
    HHmm: {
      hour: "numeric",
      minute: "numeric",
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
