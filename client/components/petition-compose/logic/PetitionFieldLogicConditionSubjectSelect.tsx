import { Box, Flex, Text } from "@chakra-ui/react";
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
import { memo, useMemo } from "react";
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
}: ValueProps<PetitionFieldLogicCondition, false> & {
  isReadOnly?: boolean;
}) {
  const intl = useIntl();
  const rsProps = useReactSelectProps<ConditionSubjectSelectOption, false, never>({
    isReadOnly,
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
  const { fieldsWithIndices } = usePetitionFieldLogicContext();

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

    const value: ConditionSubjectSelectOption | null =
      fieldOptions.find((o) =>
        o.type === "FIELD"
          ? o.field.id === condition.fieldId && condition.column === undefined
          : o.type === "DYNAMIC_SELECT_OPTION"
            ? o.field.id === condition.fieldId && o.columnIndex === condition.column
            : never(),
      ) ?? null;

    return {
      options: fieldOptions,
      value,
    };
  }, [fieldsWithIndices, condition]);

  return (
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
          never();
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
    };

const ConditionSubjectItem = memo(function ConditionSubjectItem({
  option,
  highlight,
  indent,
}: {
  option: ConditionSubjectSelectOption;
  highlight?: string;
  indent?: boolean;
}) {
  if (option.type === "FIELD") {
    const { field, fieldIndex } = option;
    return (
      <>
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
          marginLeft={2}
          paddingRight={1}
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
      </>
    );
  } else if (option.type === "DYNAMIC_SELECT_OPTION") {
    const { fieldIndex, column, label, isChild } = option;
    return (
      <>
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
          marginLeft={2}
          paddingRight={1}
          flex="1"
          minWidth="0"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {label}
        </HighlightText>
      </>
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
      : never();
};

const getOptionLabel = (option: ConditionSubjectSelectOption) => {
  if (option.type === "FIELD") {
    return option.field.title ?? "";
  } else if (option.type === "DYNAMIC_SELECT_OPTION") {
    return `${option.field.title ?? ""} ${option.label}`;
  } else {
    never();
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
