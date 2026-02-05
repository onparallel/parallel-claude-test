import { gql } from "@apollo/client";

import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { PetitionFieldMathEnumSelect_PetitionVariableEnumFragment } from "@parallel/graphql/__types";
import { isNonNullish } from "remeda";
import { Text } from "@parallel/components/ui";

interface PetitionFieldMathEnumSelectProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly?: boolean;
  variable: PetitionFieldMathEnumSelect_PetitionVariableEnumFragment;
}

export function PetitionFieldMathEnumSelect({
  value,
  onChange,
  isReadOnly,
  variable,
}: PetitionFieldMathEnumSelectProps) {
  const enumOptions = useSimpleSelectOptions(
    () => variable?.enumLabels?.map((v) => ({ label: v.label, value: v.value })) ?? [],
    [variable],
  );

  const selectedOption = enumOptions.find((o) => o.value === value);

  return isReadOnly ? (
    <Text as="span" fontWeight={500}>
      {selectedOption?.label ?? value}
    </Text>
  ) : (
    <SimpleSelect
      size="sm"
      value={value}
      onChange={(value) => {
        const _selectedOption = enumOptions.find((o) => o.value === value);
        if (isNonNullish(_selectedOption)) {
          onChange(_selectedOption.value);
        }
      }}
      options={enumOptions}
    />
  );
}

const _fragments = {
  PetitionVariableEnum: gql`
    fragment PetitionFieldMathEnumSelect_PetitionVariableEnum on PetitionVariableEnum {
      name
      defaultEnum: defaultValue
      enumLabels: valueLabels {
        value
        label
      }
    }
  `,
};
