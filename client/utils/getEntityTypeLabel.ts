import { IntlShape } from "react-intl";

export function getEntityTypeLabel(intl: IntlShape, type?: "PERSON" | "COMPANY" | null) {
  if (type === "PERSON") {
    return intl.formatMessage({
      id: "util.get-entity-type-label.person",
      defaultMessage: "Individuals",
    });
  } else if (type === "COMPANY") {
    return intl.formatMessage({
      id: "util.get-entity-type-label.company",
      defaultMessage: "Companies",
    });
  }

  return null;
}
