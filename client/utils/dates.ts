export type DateTimeFormatOptions = Exclude<
  Intl.DateTimeFormatOptions,
  "localeMatcher"
>;

/**
 * Prebuilt DateTimeFormatOptions to use with react-intl
 */
export const FORMATS = {
  /**
   * E.g. March 5, 2020
   */
  LL: {
    day: "numeric",
    month: "long",
    year: "numeric"
  } as DateTimeFormatOptions,
  /**
   * E.g. March 5, 2020, 2:16 PM
   */
  LLL: {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric"
  } as DateTimeFormatOptions,
  /**
   * E.g. March 5, 2020, 2:16:39 PM
   */
  FULL: {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
  } as DateTimeFormatOptions
};
