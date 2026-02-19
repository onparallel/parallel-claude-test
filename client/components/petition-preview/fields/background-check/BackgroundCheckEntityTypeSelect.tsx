import {
  SimpleSelect,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { BackgroundCheckEntitySearchType } from "@parallel/graphql/__types";
import { IntlShape, useIntl } from "react-intl";

export function BackgroundCheckEntityTypeSelect(
  props: Omit<SimpleSelectProps<BackgroundCheckEntitySearchType, false>, "options">,
) {
  const intl = useIntl();
  const options = useBackgroundCheckEntityTypeSelectOptions();
  return (
    <SimpleSelect
      options={options}
      isClearable={true}
      isSearchable={false}
      placeholder={intl.formatMessage({
        id: "component.background-check-entity-type-select.entity-type-any",
        defaultMessage: "All results",
      })}
      {...props}
    />
  );
}

const useBackgroundCheckEntityTypeSelectOptions = () => {
  return useSimpleSelectOptions(
    (intl: IntlShape) => [
      {
        value: "PERSON",
        label: intl.formatMessage({
          id: "component.background-check-entity-type-select.entity-type-person",
          defaultMessage: "Individuals",
        }),
      },
      {
        value: "COMPANY",
        label: intl.formatMessage({
          id: "component.background-check-entity-type-select.entity-type-company",
          defaultMessage: "Companies",
        }),
      },
    ],
    [],
  );
};
