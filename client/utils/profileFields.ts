import { useTheme } from "@chakra-ui/react";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { IntlShape, useIntl } from "react-intl";

const TYPES = <Record<ProfileTypeFieldType, (intl: IntlShape) => string>>{
  SHORT_TEXT: (intl) =>
    intl.formatMessage({
      id: "generic.profile-type-field-type.short-text",
      defaultMessage: "Short text",
    }),
  TEXT: (intl) =>
    intl.formatMessage({
      id: "generic.profile-type-field-type.text",
      defaultMessage: "Long text",
    }),
  NUMBER: (intl) =>
    intl.formatMessage({
      id: "generic.profile-type-field-type.number",
      defaultMessage: "Numbers",
    }),
  PHONE: (intl) =>
    intl.formatMessage({
      id: "generic.profile-type-field-type.phone",
      defaultMessage: "Phone number",
    }),
  DATE: (intl) =>
    intl.formatMessage({
      id: "generic.profile-type-field-type.date",
      defaultMessage: "Date",
    }),
  FILE: (intl) =>
    intl.formatMessage({
      id: "generic.profile-type-field-type.file-upload",
      defaultMessage: "Documents and files",
    }),
};

export function useProfileTypeFieldTypes() {
  return useSimpleSelectOptions<ProfileTypeFieldType>(
    (intl) =>
      (["SHORT_TEXT", "TEXT", "NUMBER", "PHONE", "DATE", "FILE"] as ProfileTypeFieldType[]).map(
        (type) => ({ value: type, label: TYPES[type](intl) }),
      ),
    [],
  );
}

export function useProfileTypeFieldTypeLabel(type: ProfileTypeFieldType) {
  const intl = useIntl();
  return TYPES[type](intl);
}

export function useProfileTypeFieldTypeColor(type: ProfileTypeFieldType) {
  const theme = useTheme();
  return (
    {
      FILE: theme.colors.teal[400],
      TEXT: theme.colors.yellow[500],
      SHORT_TEXT: theme.colors.yellow[400],
      NUMBER: theme.colors.orange[500],
      PHONE: theme.colors.orange[400],
      DATE: theme.colors.orange[300],
    } as Record<ProfileTypeFieldType, string>
  )[type];
}
