import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePetitionFieldTypeLabels() {
  const intl = useIntl();
  return useMemo(() => {
    return {
      FILE_UPLOAD: intl.formatMessage({
        id: "petition.field-type.file-upload",
        defaultMessage: "Documents and files",
      }),
      TEXT: intl.formatMessage({
        id: "petition.field-type.text",
        defaultMessage: "Text reply",
      }),
      HEADING: intl.formatMessage({
        id: "petition.field-type.heading",
        defaultMessage: "Section",
      }),
      SELECT: intl.formatMessage({
        id: "petition.field-type.select",
        defaultMessage: "Dropdown",
      }),
    };
  }, [intl.locale]);
}
