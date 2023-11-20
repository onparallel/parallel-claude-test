import { Badge, Box, Flex, HStack, StackProps, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { PetitionFieldLogicContext_PetitionFieldFragment } from "@parallel/graphql/__types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { PetitionFieldIndex, letters } from "@parallel/utils/fieldIndices";
import { defaultFieldCondition } from "@parallel/utils/fieldLogic/conditions";
import { PetitionFieldLogicCondition } from "@parallel/utils/fieldLogic/types";
import { never } from "@parallel/utils/never";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, {
  CSSObjectWithLabel,
  MultiValueGenericProps,
  OptionProps,
  SingleValueProps,
  components,
} from "react-select";
import { isDefined } from "remeda";
import { assert } from "ts-essentials";
import { usePetitionFieldLogicContext } from "./PetitionFieldLogicContext";

export function PetitionFieldLogicConditionSubjectSelect({
  value: condition,
  onChange,
  isReadOnly,
  showErrors,
}: ValueProps<PetitionFieldLogicCondition, false> & {
  isReadOnly?: boolean;
  showErrors?: boolean;
}) {
  const intl = useIntl();

  const { fieldsWithIndices, variables } = usePetitionFieldLogicContext();

  const { options, value } = useMemo(() => {
    const fieldOptions = fieldsWithIndices.flatMap(([field, fieldIndex]) => {
      const options: ConditionSubjectSelectOption[] = [
        { type: "FIELD", field, fieldIndex, isChild: isDefined(field.parent) },
      ];
      if (field.type === "DYNAMIC_SELECT") {
        const { labels } = field.options as FieldOptions["DYNAMIC_SELECT"];
        const columns = letters();
        options.push(
          ...labels.map((label, index) => ({
            type: "DYNAMIC_SELECT_OPTION" as const,
            field,
            isChild: isDefined(field.parent),
            fieldIndex,
            column: columns.next().value!,
            columnIndex: index,
            label,
          })),
        );
      }
      return options;
    });

    const variableOptions = variables.map((v) => ({
      type: "VARIABLE" as const,
      variableName: v.name,
    }));

    const value: ConditionSubjectSelectOption | null =
      "fieldId" in condition
        ? fieldOptions.find((o) =>
            o.type === "FIELD"
              ? o.field.id === condition.fieldId && condition.column === undefined
              : o.type === "DYNAMIC_SELECT_OPTION"
                ? o.field.id === condition.fieldId && o.columnIndex === condition.column
                : never(),
          ) ?? null
        : variableOptions.find((o) => o.variableName === condition.variableName) ?? null;

    return {
      options: [
        {
          label: intl.formatMessage({
            id: "component.petition-field-logic-condition-subject-select.group-variables",
            defaultMessage: "Variables",
          }),
          options: variableOptions,
        },
        {
          label: intl.formatMessage({
            id: "component.petition-field-logic-condition-subject-select.group-fields",
            defaultMessage: "Fields",
          }),
          options: fieldOptions,
        },
      ],
      value,
    };
  }, [fieldsWithIndices, condition]);

  const rsProps = useReactSelectProps<ConditionSubjectSelectOption, false, never>({
    isReadOnly,
    isInvalid: showErrors && !value,
    size: "sm",
    components: {
      SingleValue,
      MultiValueLabel,
      Option,
    },
    styles: {
      option: (styles: CSSObjectWithLabel) => ({
        ...styles,
        display: "flex",
        padding: "6px 8px",
      }),
    },
  });

  return isReadOnly ? (
    <ConditionSubjectItem
      option={value!}
      display="inline-flex"
      maxWidth="400px"
      height="18px"
      position="relative"
      fontWeight="semibold"
      top="2.5px"
      spacing={1}
      marginRight={2}
    />
  ) : (
    <Select
      placeholder={intl.formatMessage({
        id: "component.petition-field-select.placeholder",
        defaultMessage: "Select a field",
      })}
      options={options as any}
      value={value}
      onChange={(value) => {
        assert(isDefined(value));
        if (value.type === "FIELD") {
          onChange(defaultFieldCondition(value.field));
        } else if (value.type === "DYNAMIC_SELECT_OPTION") {
          onChange(defaultFieldCondition([value.field, value.columnIndex]));
        } else {
          onChange({
            variableName: value.variableName,
            operator: "GREATER_THAN",
            value: 0,
          });
        }
      }}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      {...rsProps}
    />
  );
}

type ConditionSubjectSelectOption =
  | {
      type: "FIELD";
      field: PetitionFieldLogicContext_PetitionFieldFragment;
      fieldIndex: PetitionFieldIndex;
      isChild?: boolean;
    }
  | {
      type: "DYNAMIC_SELECT_OPTION";
      field: PetitionFieldLogicContext_PetitionFieldFragment;
      fieldIndex: PetitionFieldIndex;
      isChild?: boolean;
      column: string;
      columnIndex: number;
      label: string;
    }
  | {
      type: "VARIABLE";
      variableName: string;
    };

const ConditionSubjectItem = chakraForwardRef<
  "div",
  {
    option: ConditionSubjectSelectOption;
    highlight?: string;
    indent?: boolean;
  } & StackProps
>(function ConditionSubjectItem({ option, highlight, indent, ...props }, ref) {
  if (option.type === "FIELD") {
    const { field, fieldIndex } = option;
    return (
      <HStack ref={ref} {...props}>
        <PetitionFieldTypeIndicator
          as="div"
          type={field.type}
          fieldIndex={fieldIndex}
          isTooltipDisabled
          flexShrink={0}
          marginLeft={indent && option.isChild ? 2 : 0}
        />
        <Box
          fontSize="sm"
          flex="1"
          minWidth="0"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {field.title ? (
            <HighlightText as="span" search={highlight}>
              {field.title}
            </HighlightText>
          ) : (
            <Text as="span" textStyle="hint">
              <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
            </Text>
          )}
        </Box>
      </HStack>
    );
  } else if (option.type === "DYNAMIC_SELECT_OPTION") {
    const { fieldIndex, column, label, isChild } = option;
    return (
      <HStack ref={ref} {...props}>
        <PetitionFieldTypeIndicator
          as="div"
          type="DYNAMIC_SELECT"
          fieldIndex={`${fieldIndex}${column}`}
          isTooltipDisabled
          flexShrink={0}
          marginLeft={indent ? (isChild ? 4 : 2) : 0}
        />
        <HighlightText
          as="div"
          search={highlight}
          fontSize="sm"
          flex="1"
          minWidth="0"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {label}
        </HighlightText>
      </HStack>
    );
  } else if (option.type === "VARIABLE") {
    return (
      <Badge
        ref={ref}
        {...props}
        colorScheme="blue"
        fontSize="sm"
        textTransform="none"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        top={0}
        height="auto"
      >
        <HighlightText as="span" alignSelf="center" search={highlight}>
          {option.variableName}
        </HighlightText>
      </Badge>
    );
  } else {
    never();
  }
});

const getOptionValue = (option: ConditionSubjectSelectOption) => {
  return option.type === "FIELD"
    ? `${option.type}:${option.field.id}`
    : option.type === "DYNAMIC_SELECT_OPTION"
      ? `${option.type}:${option.field.id}-${option.column}`
      : `${option.type}:${option.variableName}`;
};

const getOptionLabel = (option: ConditionSubjectSelectOption) => {
  if (option.type === "FIELD") {
    return option.field.title ?? "";
  } else if (option.type === "DYNAMIC_SELECT_OPTION") {
    return `${option.field.title ?? ""} ${option.label}`;
  } else {
    return option.variableName;
  }
};

function SingleValue(props: SingleValueProps<ConditionSubjectSelectOption, false, never>) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <ConditionSubjectItem option={props.data} highlight={props.selectProps.inputValue ?? ""} />
      </Flex>
    </components.SingleValue>
  );
}

function MultiValueLabel({
  children,
  ...props
}: MultiValueGenericProps<ConditionSubjectSelectOption, false, never>) {
  return (
    <components.MultiValueLabel {...props}>
      <Flex flexWrap="nowrap">
        <ConditionSubjectItem option={props.data} highlight={props.selectProps.inputValue ?? ""} />
      </Flex>
    </components.MultiValueLabel>
  );
}

function Option(props: OptionProps<ConditionSubjectSelectOption, false, never>) {
  return (
    <components.Option {...props}>
      <ConditionSubjectItem
        option={props.data}
        highlight={props.selectProps.inputValue ?? ""}
        indent
      />
    </components.Option>
  );
}
