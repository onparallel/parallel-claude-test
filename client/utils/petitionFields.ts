import { useTheme } from "@chakra-ui/react";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { Maybe } from "./types";

export type FileUploadAccepts = "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT";

export type FieldOptions = {
  HEADING: {
    hasPageBreak: boolean;
  };
  FILE_UPLOAD: {
    accepts: Maybe<FileUploadAccepts[]>;
  };
  TEXT: {
    multiline: boolean;
    placeholder: Maybe<string>;
  };
  SELECT: {
    values: string[];
    placeholder: Maybe<string>;
  };
};

export function usePetitionFieldTypeLabel(type: PetitionFieldType) {
  const intl = useIntl();
  return useMemo(() => {
    switch (type) {
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
        throw new Error(`Missing PetitionFieldType "${type}"`);
    }
  }, [intl.locale, type]);
}

export function usePetitionFieldTypeColor(type: PetitionFieldType) {
  const theme = useTheme();
  return ({
    FILE_UPLOAD: theme.colors.teal[400],
    TEXT: theme.colors.yellow[400],
    HEADING: theme.colors.blue[400],
    SELECT: theme.colors.pink[400],
  } as Record<PetitionFieldType, string>)[type];
}
