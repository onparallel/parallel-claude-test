export type DateTimeFormatOptions = Exclude<
  Intl.DateTimeFormatOptions,
  "localeMatcher"
>;

/**
 * Prebuilt DateTimeFormatOptions to use with react-intl
 */
export const FORMATS = {
  /**
   * E.g. 05/03/2020
   */
  L: {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  },
  /**
   * E.g. March 5, 2020
   */
  LL: {
    day: "numeric",
    month: "long",
    year: "numeric",
  } as DateTimeFormatOptions,
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
  } as DateTimeFormatOptions,
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
  } as DateTimeFormatOptions,
};
