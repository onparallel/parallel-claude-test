import { FORMATS } from "@parallel/utils/dates";
import { IntlShape } from "react-intl";

// Same function in server/src/pdf/utils/formatPartialDate.ts to format the date in the PDF
// date is a string in the format "YYYY-MM-DD" or "YYYY-MM" or "YYYY"

export function formatPartialDate({ date, intl }: { date: string; intl: IntlShape }) {
  const splittedDate = date.split("-").map((d) => parseInt(d));

  if (splittedDate.length === 1) {
    return intl.formatDate(new Date(date), {
      timeZone: "UTC",
      year: "numeric",
    });
  } else if (splittedDate.length === 2) {
    return intl.formatDate(new Date(date), {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    });
  } else {
    return intl.formatDate(new Date(date), {
      timeZone: "UTC",
      ...FORMATS.ll,
    });
  }
}
