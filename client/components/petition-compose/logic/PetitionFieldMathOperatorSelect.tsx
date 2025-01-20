import { Box, HStack } from "@chakra-ui/react";
import {
  AddIcon,
  AssignIcon,
  DivideIcon,
  MultiplyIcon,
  SubstractIcon,
} from "@parallel/chakra/icons";
import { PetitionFieldMathOperator } from "@parallel/utils/fieldLogic/types";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { OptionProps, SingleValueProps, components } from "react-select";
import { SimpleOption, SimpleSelect, SimpleSelectProps } from "../../common/SimpleSelect";

interface PetitionFieldMathOperatorSelectOption extends SimpleOption<PetitionFieldMathOperator> {
  icon: ReactNode;
}

export function PetitionFieldMathOperatorSelect({
  value,
  isReadOnly,
  ...props
}: Omit<
  SimpleSelectProps<PetitionFieldMathOperator, false, PetitionFieldMathOperatorSelectOption>,
  "options"
>) {
  const intl = useIntl();
  const options = useMemo<PetitionFieldMathOperatorSelectOption[]>(
    () => [
      {
        value: "ADDITION",
        label: intl.formatMessage({
          id: "component.petition-field-math-operator-select.addition",
          defaultMessage: "Add",
        }),
        icon: <AddIcon />,
      },
      {
        value: "SUBSTRACTION",
        label: intl.formatMessage({
          id: "component.petition-field-math-operator-select.substraction",
          defaultMessage: "Substract",
        }),
        icon: <SubstractIcon />,
      },
      {
        value: "MULTIPLICATION",
        label: intl.formatMessage({
          id: "component.petition-field-math-operator-select.multiplication",
          defaultMessage: "Multiply",
        }),
        icon: <MultiplyIcon />,
      },
      {
        value: "DIVISION",
        label: intl.formatMessage({
          id: "component.petition-field-math-operator-select.division",
          defaultMessage: "Divide",
        }),
        icon: <DivideIcon />,
      },
      {
        value: "ASSIGNATION",
        label: intl.formatMessage({
          id: "component.petition-field-math-operator-select.assignation",
          defaultMessage: "Assign",
        }),
        icon: <AssignIcon />,
      },
      {
        value: "ASSIGNATION_IF_LOWER",
        label: intl.formatMessage({
          id: "component.petition-field-math-operator-select.assignation-if-lower",
          defaultMessage: "Assign if lower",
        }),
        icon: <AssignIcon />,
      },
      {
        value: "ASSIGNATION_IF_GREATER",
        label: intl.formatMessage({
          id: "component.petition-field-math-operator-select.assignation-if-greater",
          defaultMessage: "Assign if greater",
        }),
        icon: <AssignIcon />,
      },
    ],
    [],
  );
  const option = options.find((o) => o.value === value)!;
  return isReadOnly ? (
    <HStack spacing={1.5}>
      <Box display="flex" as="span" fontSize="2xs">
        {option.icon}
      </Box>
      <Box as="span">{option.label}</Box>
    </HStack>
  ) : (
    <SimpleSelect
      isSearchable={false}
      size="sm"
      options={options}
      styles={{ control: (styles) => ({ ...styles, flexWrap: "nowrap" }) }}
      value={value}
      components={{ SingleValue, Option }}
      {...props}
    />
  );
}

function SingleValue(props: SingleValueProps<PetitionFieldMathOperatorSelectOption>) {
  return (
    <components.SingleValue {...props}>
      <OperatorOption option={props.data} />
    </components.SingleValue>
  );
}

function Option(props: OptionProps<PetitionFieldMathOperatorSelectOption>) {
  return (
    <components.Option {...props}>
      <OperatorOption option={props.data} />
    </components.Option>
  );
}

function OperatorOption({
  option: { icon, label },
}: {
  option: { label: string; icon: ReactNode };
}) {
  return (
    <HStack>
      {icon}
      <Box>{label}</Box>
    </HStack>
  );
}
