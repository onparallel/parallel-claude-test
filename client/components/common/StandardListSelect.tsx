import { forwardRef } from "react";
import { IntlShape, useIntl } from "react-intl";
import { SelectInstance } from "react-select";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "./SimpleSelect";

export type StandardListSelectProps = Omit<SimpleSelectProps<string>, "options">;

const STANDARD_LISTS = {
  COUNTRIES: (intl) =>
    intl.formatMessage({
      id: "component.standard-list-select.countries-iso",
      defaultMessage: "List of countries",
    }),
  EU_COUNTRIES: (intl) =>
    intl.formatMessage({
      id: "component.standard-list-select.eu-countries-iso",
      defaultMessage: "List of EU countries",
    }),
  NON_EU_COUNTRIES: (intl) =>
    intl.formatMessage({
      id: "component.standard-list-select.non-eu-countries-iso",
      defaultMessage: "List of non-EU countries",
    }),
  CURRENCIES: (intl) =>
    intl.formatMessage({
      id: "component.standard-list-select.currencies",
      defaultMessage: "List of currencies",
    }),
  NACE: (intl) =>
    intl.formatMessage({
      id: "component.standard-list-select.nace",
      defaultMessage: "NACE codes",
    }),
  CNAE_2009: (intl) =>
    intl.formatMessage({
      id: "component.standard-list-select.cnae-2009",
      defaultMessage: "CNAE codes (2009)",
    }),
  CNAE_2025: (intl) =>
    intl.formatMessage({
      id: "component.standard-list-select.cnae-2025",
      defaultMessage: "CNAE codes (2025)",
    }),
  SIC: (intl) =>
    intl.formatMessage({
      id: "component.standard-list-select.sic",
      defaultMessage: "SIC codes",
    }),
} satisfies Record<string, (intl: IntlShape) => string>;

type StandardListType = keyof typeof STANDARD_LISTS;

export const getStandardListLabel = (value: StandardListType, intl: IntlShape) => {
  return STANDARD_LISTS[value](intl) || value;
};

const useStandardListSelectOptions = () => {
  const options = useSimpleSelectOptions(
    (intl) =>
      Object.entries(STANDARD_LISTS).map(([value, label]) => ({
        value: value as StandardListType,
        label: label(intl),
      })),
    [],
  );
  return options;
};

export const StandardListSelect = forwardRef<
  SelectInstance<SimpleOption<string>, false>,
  StandardListSelectProps
>(function StandardListSelect(props, ref) {
  const intl = useIntl();
  const options = useStandardListSelectOptions();
  return (
    <SimpleSelect
      ref={ref}
      options={options}
      placeholder={intl.formatMessage({
        id: "component.standard-list-select.no-list",
        defaultMessage: "No list",
      })}
      {...props}
    />
  );
});
