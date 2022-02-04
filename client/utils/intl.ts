import { PetitionLocale } from "@parallel/graphql/__types";

export function getSeparator(locale: PetitionLocale, separatorType: "decimal" | "group") {
  const numberWithGroupAndDecimalSeparator = 10000.1;
  return Intl?.NumberFormat(locale)
    ?.formatToParts(numberWithGroupAndDecimalSeparator)
    ?.find((part) => part.type === separatorType)?.value;
}
