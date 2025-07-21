import { IntlShape } from "react-intl";
import { FORMATS } from "../../util/dates";

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
