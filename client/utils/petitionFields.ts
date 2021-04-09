import { useTheme } from "@chakra-ui/react";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { Maybe } from "./types";

export type FileUploadAccepts = "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT";

export type DynamicSelectOption = [string, Array<DynamicSelectOption | string>];

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
  DYNAMIC_SELECT: {
    values: DynamicSelectOption[];
    labels: string[];
    file?: {
      id: string;
      name: string;
      size: number;
      updatedAt: Date;
    };
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
          defaultMessage: "Select",
        });
      case "DYNAMIC_SELECT":
        return intl.formatMessage({
          id: "petition.field-type.conditional-select",
          defaultMessage: "Conditional select",
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
    DYNAMIC_SELECT: theme.colors.pink[600],
  } as Record<PetitionFieldType, string>)[type];
}

export function getDynamicSelectValues(
  values: (string | DynamicSelectOption)[],
  level: number
): string[] {
  if (level === 0) {
    return Array.isArray(values[0])
      ? (values as DynamicSelectOption[]).map(([value]) => value)
      : (values as string[]);
  } else {
    if (values.length && !Array.isArray(values[0])) {
      throw new Error("Invalid level");
    }
    return (values as DynamicSelectOption[]).flatMap(([, children]) =>
      getDynamicSelectValues(children, level - 1)
    );
  }
}

export function getFirstDynamicSelectValue(
  values: (string | DynamicSelectOption)[],
  level: number
): string {
  if (level === 0) {
    return Array.isArray(values[0])
      ? (values as DynamicSelectOption[])[0][0]
      : (values as string[])[0];
  } else {
    if (!Array.isArray(values[0])) {
      throw new Error("Invalid level");
    }
    return getFirstDynamicSelectValue(
      (values as DynamicSelectOption[])[0][1],
      level - 1
    );
  }
}
