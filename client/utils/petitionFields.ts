import { useTheme } from "@chakra-ui/react";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { CountryCode } from "libphonenumber-js";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { Maybe } from "./types";

export type FileUploadAccepts = "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT";

export type DynamicSelectOption = [string, string[] | DynamicSelectOption[]];

export type FieldOptions = {
  HEADING: {
    hasCommentsEnabled: boolean;
    hasPageBreak: boolean;
  };
  FILE_UPLOAD: {
    hasCommentsEnabled: boolean;
    accepts: Maybe<FileUploadAccepts[]>;
  };
  SHORT_TEXT: {
    hasCommentsEnabled: boolean;
    placeholder: Maybe<string>;
  };
  TEXT: {
    hasCommentsEnabled: boolean;
    placeholder: Maybe<string>;
  };
  NUMBER: {
    hasCommentsEnabled: boolean;
    placeholder: Maybe<string>;
    range: {
      min: number | undefined;
      max: number | undefined;
    };
  };
  PHONE: {
    hasCommentsEnabled: boolean;
    placeholder: Maybe<string>;
    defaultCountry: CountryCode;
  };
  SELECT: {
    hasCommentsEnabled: boolean;
    values: string[];
    placeholder: Maybe<string>;
  };
  DYNAMIC_SELECT: {
    hasCommentsEnabled: boolean;
    values: DynamicSelectOption[];
    labels: string[];
    file?: {
      id: string;
      name: string;
      size: number;
      updatedAt: Date;
    };
  };
  CHECKBOX: {
    hasCommentsEnabled: boolean;
    values: string[];
    limit: {
      type: string;
      min: number;
      max: number;
    };
  };
  DATE: {
    hasCommentsEnabled: boolean;
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
      case "SHORT_TEXT":
        return intl.formatMessage({
          id: "petition.field-type.short-text",
          defaultMessage: "Short replies",
        });
      case "TEXT":
        return intl.formatMessage({
          id: "petition.field-type.text",
          defaultMessage: "Long replies",
        });
      case "NUMBER":
        return intl.formatMessage({
          id: "petition.field-type.number",
          defaultMessage: "Numbers",
        });
      case "PHONE":
        return intl.formatMessage({
          id: "petition.field-type.phone",
          defaultMessage: "Phone number",
        });
      case "HEADING":
        return intl.formatMessage({
          id: "petition.field-type.heading",
          defaultMessage: "Text block",
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
      case "CHECKBOX":
        return intl.formatMessage({
          id: "petition.field-type.checkbox",
          defaultMessage: "Multiple choice",
        });
      case "DATE":
        return intl.formatMessage({
          id: "petition.field-type.date",
          defaultMessage: "Date",
        });
      default:
        throw new Error(`Missing PetitionFieldType "${type}"`);
    }
  }, [intl.locale, type]);
}

export function usePetitionFieldTypeColor(type: PetitionFieldType) {
  const theme = useTheme();
  return (
    {
      FILE_UPLOAD: theme.colors.teal[400],
      TEXT: theme.colors.yellow[500],
      SHORT_TEXT: theme.colors.yellow[400],
      HEADING: theme.colors.blue[400],
      SELECT: theme.colors.pink[400],
      DYNAMIC_SELECT: theme.colors.pink[600],
      CHECKBOX: theme.colors.purple[500],
      NUMBER: theme.colors.orange[500],
      PHONE: theme.colors.orange[400],
      DATE: theme.colors.orange[300],
    } as Record<PetitionFieldType, string>
  )[type];
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
    return getFirstDynamicSelectValue((values as DynamicSelectOption[])[0][1], level - 1);
  }
}

export function getMinMaxCheckboxLimit({
  min,
  max,
  valuesLength,
  optional = false,
}: {
  min: number;
  max: number;
  valuesLength: number;
  optional?: boolean;
}) {
  min = !optional && min === 0 ? 1 : min;

  if (max > valuesLength) {
    max = valuesLength;
  }

  min = min >= max ? (max >= 2 - Number(optional) ? max - 1 : Number(!optional)) : min;

  return [min, max];
}
