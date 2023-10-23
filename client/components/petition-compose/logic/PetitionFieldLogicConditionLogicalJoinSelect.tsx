import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { PetitionFieldLogicConditionLogicalJoin } from "@parallel/utils/fieldLogic/types";
import { SimpleSelect, SimpleSelectProps } from "../../common/SimpleSelect";

export function PetitionFieldLogicConditionLogicalJoinSelect(
  props: Omit<SimpleSelectProps<PetitionFieldLogicConditionLogicalJoin>, "options">,
) {
  const options = useSimpleSelectOptions(
    (intl) => [
      {
        value: "AND",
        label: intl.formatMessage({
          id: "component.petition-field-visibility-editor.and",
          defaultMessage: "and",
        }),
      },
      {
        value: "OR",
        label: intl.formatMessage({
          id: "component.petition-field-visibility-editor.or",
          defaultMessage: "or",
        }),
      },
    ],
    [],
  );
  return (
    <SimpleSelect
      size="sm"
      options={options}
      styles={{ control: (styles) => ({ ...styles, flexWrap: "nowrap" }) }}
      {...props}
    />
  );
}
