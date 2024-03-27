import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectProps,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { BackgroundCheckEntitySearchType } from "@parallel/graphql/__types";
import { Focusable } from "@parallel/utils/types";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { IntlShape, useIntl } from "react-intl";
import { SelectInstance } from "react-select";

export const BackgroundCheckEntityTypeSelect = forwardRef<
  Focusable,
  Omit<SimpleSelectProps<BackgroundCheckEntitySearchType, false>, "options">
>(function BackgroundCheckEntityTypeSelect(props, ref) {
  const intl = useIntl();
  const options = useBackgroundCheckEntityTypeSelectOptions();
  const _ref = useRef<SelectInstance<SimpleOption<BackgroundCheckEntitySearchType>, false>>(null);
  useImperativeHandle(ref, () => ({
    focus: () => {
      _ref.current?.focus();
    },
  }));

  return (
    <SimpleSelect
      ref={_ref}
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
});

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
