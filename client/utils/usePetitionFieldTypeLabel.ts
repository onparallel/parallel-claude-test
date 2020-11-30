import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePetitionFieldTypeLabel(label: PetitionFieldType) {
  const intl = useIntl();
  return useMemo(() => {
    switch (label) {
      case "FILE_UPLOAD":
        return intl.formatMessage({
          id: "petition.field-type.file-upload",
          defaultMessage: "Documents and files",
        });
      case "TEXT":
        return intl.formatMessage({
          id: "petition.field-type.text",
          defaultMessage: "Text reply",
        });
      case "HEADING":
        return intl.formatMessage({
          id: "petition.field-type.heading",
          defaultMessage: "Section",
        });
      case "SELECT":
        return intl.formatMessage({
          id: "petition.field-type.select",
          defaultMessage: "Dropdown",
        });
      default:
        throw new Error(`Missing PetitionFieldType "${label}"`);
    }
  }, [intl.locale, label]);
}
