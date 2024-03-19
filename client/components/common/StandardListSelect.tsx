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

export const getStandardListLabel = (value: string, intl: IntlShape) => {
  const labels = {
    COUNTRIES: intl.formatMessage({
      id: "component.standard-list-select.countries-iso",
      defaultMessage: "List of countries",
    }),
  } as Record<string, string>;

  return labels[value] || value;
};

const useStandardListSelectOptions = () => {
  const options = useSimpleSelectOptions(
    (intl) => [
      {
        label: getStandardListLabel("COUNTRIES", intl),
        value: "COUNTRIES",
      },
    ],
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
