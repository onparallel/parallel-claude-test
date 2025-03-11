import { useTheme } from "@chakra-ui/react";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { IntlShape, useIntl } from "react-intl";
import { DynamicSelectOption } from "./fieldOptions";

export const isValueCompatible = (oldType: PetitionFieldType, newType: PetitionFieldType) => {
  return (
    ["TEXT", "SHORT_TEXT", "SELECT", "DATE", "PHONE"].includes(oldType) &&
    ["TEXT", "SHORT_TEXT"].includes(newType)
  );
};

export function usePetitionFieldTypeLabel(type: PetitionFieldType) {
  const intl = useIntl();
  return useMemo(() => {
    return getPetitionFieldTypeLabel(intl, type);
  }, [intl.locale, type]);
}

export function getPetitionFieldTypeLabel(intl: IntlShape, type: PetitionFieldType) {
  switch (type) {
    case "FILE_UPLOAD":
      return intl.formatMessage({
        id: "generic.petition-field-type-file-upload",
        defaultMessage: "Documents and files",
      });
    case "SHORT_TEXT":
      return intl.formatMessage({
        id: "generic.petition-field-type-short-text",
        defaultMessage: "Short replies",
      });
    case "TEXT":
      return intl.formatMessage({
        id: "generic.petition-field-type-text",
        defaultMessage: "Long replies",
      });
    case "NUMBER":
      return intl.formatMessage({
        id: "generic.petition-field-type-number",
        defaultMessage: "Numbers",
      });
    case "PHONE":
      return intl.formatMessage({
        id: "generic.petition-field-type-phone",
        defaultMessage: "Phone number",
      });
    case "HEADING":
      return intl.formatMessage({
        id: "generic.petition-field-type-heading",
        defaultMessage: "Text block",
      });
    case "SELECT":
      return intl.formatMessage({
        id: "generic.petition-field-type-select",
        defaultMessage: "Select",
      });
    case "DYNAMIC_SELECT":
      return intl.formatMessage({
        id: "generic.petition-field-type-conditional-select",
        defaultMessage: "Conditional select",
      });
    case "CHECKBOX":
      return intl.formatMessage({
        id: "generic.petition-field-type-checkbox",
        defaultMessage: "Multiple choice",
      });
    case "DATE":
      return intl.formatMessage({
        id: "generic.petition-field-type-date",
        defaultMessage: "Date",
      });
    case "DATE_TIME":
      return intl.formatMessage({
        id: "generic.petition-field-type-date-and-time",
        defaultMessage: "Date and time",
      });
    case "ES_TAX_DOCUMENTS":
      return intl.formatMessage({
        id: "generic.petition-field-type-tax-documents",
        defaultMessage: "Official documents (🇪🇸)",
      });
    case "DOW_JONES_KYC":
      return intl.formatMessage({
        id: "generic.petition-field-type-dow-jones-kyc-research",
        defaultMessage: "Search in Dow Jones",
      });
    case "BACKGROUND_CHECK":
      return intl.formatMessage({
        id: "generic.petition-field-type-background-check",
        defaultMessage: "Background check",
      });
    case "FIELD_GROUP":
      return intl.formatMessage({
        id: "generic.petition-field-type-field-group",
        defaultMessage: "Group of fields",
      });
    case "ID_VERIFICATION":
      return intl.formatMessage({
        id: "generic.petition-field-type-id-verification",
        defaultMessage: "ID Verification",
      });
    case "PROFILE_SEARCH":
      return intl.formatMessage({
        id: "generic.petition-field-type-profile-search",
        defaultMessage: "Profile search",
      });
    default:
      throw new Error(`Missing PetitionFieldType "${type}"`);
  }
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
      DATE_TIME: "#EB9753",
      ES_TAX_DOCUMENTS: theme.colors.teal[500],
      DOW_JONES_KYC: "#48A3D3",
      BACKGROUND_CHECK: theme.colors.green[700],
      FIELD_GROUP: theme.colors.blue[600],
      ID_VERIFICATION: theme.colors.green[500],
      PROFILE_SEARCH: theme.colors.green[500],
    } as Record<PetitionFieldType, string>
  )[type];
}

export function getDynamicSelectValues(
  values: (string | DynamicSelectOption)[],
  level: number,
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
      getDynamicSelectValues(children, level - 1),
    );
  }
}

export function getFirstDynamicSelectValue(
  values: (string | DynamicSelectOption)[],
  level: number,
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
