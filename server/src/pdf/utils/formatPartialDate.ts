import { useIntl } from "react-intl";
import { FORMATS } from "../../util/dates";

export function formatPartialDate({ date, separator = "-" }: { date: string; separator?: string }) {
  const intl = useIntl();
  const splittedDate = date.split(separator).map((d) => parseInt(d));

  if (splittedDate.length === 1) {
    return date;
  } else if (splittedDate.length === 2) {
    return intl.formatDate(new Date(splittedDate[0], splittedDate[1], 1), {
      month: "long",
      year: "numeric",
    });
  } else {
    return intl.formatDate(new Date(splittedDate[0], splittedDate[1], splittedDate[2]), FORMATS.ll);
  }
}
