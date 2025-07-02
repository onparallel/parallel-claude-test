import { Badge, Box, Flex, HStack, StackProps, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { NumeralInput } from "@parallel/components/common/NumeralInput";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { PetitionFieldLogicContext_PetitionFieldFragment } from "@parallel/graphql/__types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { PetitionFieldMathOperand } from "@parallel/utils/fieldLogic/types";
import { never } from "@parallel/utils/never";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useMemo, useState } from "react";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import Select, {
  CSSObjectWithLabel,
  MultiValueGenericProps,
  OptionProps,
  SingleValueProps,
  components,
} from "react-select";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { usePetitionFieldLogicContext } from "./PetitionFieldLogicContext";

export function PetitionFieldMathOperandSelect({
  value: operand,
  onChange,
  isReadOnly,
}: ValueProps<PetitionFieldMathOperand, false> & {
  isReadOnly?: boolean;
}) {
  const {
    fieldWithIndex: [field],
  } = usePetitionFieldLogicContext();
  const intl = useIntl();
  const rsProps = useReactSelectProps<MathOperandOption, false, never>({
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
  const { fieldsWithIndices, variables } = usePetitionFieldLogicContext();

  const { options, value } = useMemo(() => {
    const numberOption = {
      type: "NUMBER" as const,
      value: operand.type === "NUMBER" ? operand.value : 0,
    };
    const fieldOptions = fieldsWithIndices
      .filter(
        ([f]) =>
          f.type === "NUMBER" &&
          (isNonNullish(f.parent)
            ? f.multiple === false && f.parent.id === field.parent?.id
            : f.multiple === false),
      )
      .map(([f, fieldIndex]) => ({
        type: "FIELD" as const,
        field: f,
        fieldIndex,
        isChild: isNonNullish(f.parent),
      }));

    const variableOptions = variables.map((v) => ({
      type: "VARIABLE" as const,
      variableName: v.name,
    }));

    const value: MathOperandOption | null =
      operand.type === "NUMBER"
        ? numberOption
        : operand.type === "FIELD"
          ? (fieldOptions.find((o) => o.field.id === operand.fieldId) ?? null)
          : operand.type === "VARIABLE"
            ? (variableOptions.find((o) => o.variableName === operand.name) ?? null)
            : never();

    return {
      options: [
        numberOption,
        {
          label: intl.formatMessage({
            id: "component.petition-field-math-operand-select.group-variables",
            defaultMessage: "Variables",
          }),
          options: variableOptions,
        },
        {
          label: intl.formatMessage({
            id: "component.petition-field-math-operand-select.group-fields",
            defaultMessage: "Fields",
          }),
          options: fieldOptions,
        },
      ],
      value,
    };
  }, [fieldsWithIndices, operand]);

  const select = (
    <Select
      placeholder={intl.formatMessage({
        id: "component.petition-field-math-operand-select.placeholder",
        defaultMessage: "Select an operand",
      })}
      options={options as any}
      value={value}
      onChange={(value) => {
        assert(isNonNullish(value));
        if (value.type === "FIELD") {
          onChange({ type: "FIELD", fieldId: value.field.id });
        } else if (value.type === "VARIABLE") {
          onChange({ type: "VARIABLE", name: value.variableName });
        } else if (value.type === "NUMBER") {
          onChange({ type: "NUMBER", value: value.value });
        } else {
          never();
        }
      }}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      {...rsProps}
    />
  );
  const [numberValue, setNumberValue] = useState(value?.type === "NUMBER" ? value.value : 0);

  return isReadOnly ? (
    value?.type === "NUMBER" ? (
      <FormattedNumber value={value.value} />
    ) : (
      <MathOperandItem
        option={value!}
        display="inline-flex"
        maxWidth="400px"
        height="18px"
        position="relative"
        fontWeight="semibold"
        top="2.5px"
        spacing={1}
      />
    )
  ) : value?.type === "NUMBER" ? (
    <HStack>
      <Box flex="1">{select}</Box>
      <Box flex="1">
        <NumeralInput
          size="sm"
          backgroundColor="white"
          value={value.value}
          isDisabled={isReadOnly}
          opacity={isReadOnly ? "1 !important" : undefined}
          onChange={(value) => setNumberValue(value ?? 0)}
          onBlur={() => onChange({ type: "NUMBER", value: numberValue })}
          placeholder={intl.formatMessage({
            id: "generic.enter-a-value",
            defaultMessage: "Enter a value",
          })}
        />
      </Box>
    </HStack>
  ) : (
    select
  );
}

type MathOperandOption =
  | { type: "NUMBER"; value: number }
  | {
      type: "FIELD";
      field: PetitionFieldLogicContext_PetitionFieldFragment;
      fieldIndex: PetitionFieldIndex;
      isChild?: boolean;
    }
  | {
      type: "VARIABLE";
      variableName: string;
    };

const MathOperandItem = chakraForwardRef<
  "div",
  {
    option: MathOperandOption;
    highlight?: string;
    indent?: boolean;
  } & StackProps
>(function MathOperandItem({ option, highlight, indent, ...props }, ref) {
  if (option.type === "NUMBER") {
    return (
      <Box>
        <FormattedMessage
          id="component.petition-field-math-operand-select.number"
          defaultMessage="Number"
        />
      </Box>
    );
  } else if (option.type === "FIELD") {
    const { field, fieldIndex } = option;
    return (
      <HStack ref={ref} {...props}>
        <PetitionFieldTypeIndicator
          as="div"
          type={field.type}
          fieldIndex={fieldIndex}
          isTooltipDisabled
          flexShrink={0}
          marginStart={indent && option.isChild ? 2 : 0}
          isFixedWidth={false}
        />
        <Box
          fontSize="sm"
          paddingEnd={0.5}
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
        margin={0}
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

const getOptionValue = (option: MathOperandOption) => {
  if (option.type === "FIELD") {
    return `${option.type}:${option.field.id}`;
  } else if (option.type === "VARIABLE") {
    return `${option.type}:${option.variableName}`;
  } else if (option.type === "NUMBER") {
    return `${option.type}:${option.value}`;
  } else {
    never();
  }
};

const getOptionLabel = (option: MathOperandOption) => {
  if (option.type === "FIELD") {
    return option.field.title ?? "";
  } else if (option.type === "VARIABLE") {
    return option.variableName;
  } else if (option.type === "NUMBER") {
    return "Number";
  } else {
    never();
  }
};

function SingleValue(props: SingleValueProps<MathOperandOption, false, never>) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <MathOperandItem option={props.data} highlight={props.selectProps.inputValue ?? ""} />
      </Flex>
    </components.SingleValue>
  );
}

function MultiValueLabel({
  children,
  ...props
}: MultiValueGenericProps<MathOperandOption, false, never>) {
  return (
    <components.MultiValueLabel {...props}>
      <Flex flexWrap="nowrap">
        <MathOperandItem option={props.data} highlight={props.selectProps.inputValue ?? ""} />
      </Flex>
    </components.MultiValueLabel>
  );
}

function Option(props: OptionProps<MathOperandOption, false, never>) {
  return (
    <components.Option {...props}>
      <MathOperandItem option={props.data} highlight={props.selectProps.inputValue ?? ""} indent />
    </components.Option>
  );
}
