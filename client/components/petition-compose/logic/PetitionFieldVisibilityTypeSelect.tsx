import { Text } from "@chakra-ui/react";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { PetitionFieldVisibilityType } from "@parallel/utils/fieldLogic/types";
import { useIntl } from "react-intl";
import { SimpleSelect, SimpleSelectProps } from "../../common/SimpleSelect";

export function PetitionFieldVisibilityTypeSelect({
  value,
  isReadOnly,
  ...props
}: Omit<SimpleSelectProps<PetitionFieldVisibilityType>, "options">) {
  const intl = useIntl();
  const options = useSimpleSelectOptions(
    () => [
      {
        value: "SHOW",
        label: intl.formatMessage({
          id: "component.petition-field-visibility-type-select.show",
          defaultMessage: "Show when",
        }),
      },
      {
        value: "HIDE",
        label: intl.formatMessage({
          id: "component.petition-field-visibility-type-select.hide",
          defaultMessage: "Hide when",
        }),
      },
    ],
    [],
  );

  return isReadOnly ? (
    <Text as="span">{options.find((o) => o.value === value)!.label}</Text>
  ) : (
    <SimpleSelect
      size="sm"
      value={value}
      options={options}
      styles={{ control: (styles) => ({ ...styles, flexWrap: "nowrap" }) }}
      {...props}
    />
  );
}
