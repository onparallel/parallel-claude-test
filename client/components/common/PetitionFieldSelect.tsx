import { gql } from "@apollo/client";
import { Box, Center, Flex, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { PetitionFieldSelect_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FieldOptions, usePetitionFieldTypeColor } from "@parallel/utils/petitionFields";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { If } from "@parallel/utils/types";
import { memo, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, {
  ActionMeta,
  components,
  CSSObjectWithLabel,
  MultiValueProps,
  OnChangeValue,
  OptionProps,
  SingleValueProps,
} from "react-select";
import { isDefined, zip } from "remeda";

type PetitionFieldSelectSelection = PetitionFieldSelect_PetitionFieldFragment;

export interface PetitionFieldSelectProps<
  T extends PetitionFieldSelectSelection,
  ExpandFields extends boolean = false,
  IsMulti extends boolean = false,
> extends CustomSelectProps<If<ExpandFields, T | [T, number], T>, IsMulti, never> {
  fields: T[];
  indices: PetitionFieldIndex[];
  expandFields?: ExpandFields;
}

export function PetitionFieldSelect<
  OptionType extends PetitionFieldSelectSelection,
  ExpandFields extends boolean = false,
  IsMulti extends boolean = false,
>({
  value,
  onChange,
  fields,
  indices,
  isMulti,
  expandFields,
  ...props
}: PetitionFieldSelectProps<OptionType, ExpandFields, IsMulti>) {
  const intl = useIntl();
  const rsProps = useReactSelectProps<PetitionFieldSelectOption<OptionType>, IsMulti, never>({
    placeholder: intl.formatMessage({
      id: "component.petition-field-select.placeholder",
      defaultMessage: "Select a field",
    }),
    ...(props as any),
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

  const { options, _value } = useMemo(() => {
    const options: PetitionFieldSelectOption<OptionType>[] = zip(fields, indices).flatMap(
      ([field, fieldIndex]) => {
        if (expandFields && field.type === "DYNAMIC_SELECT") {
          const { labels } = field.options as FieldOptions["DYNAMIC_SELECT"];
          return [
            { type: "FIELD", field, fieldIndex },
            ...labels.map((_, column) => ({
              type: "DYNAMIC_SELECT_OPTION" as const,
              field,
              fieldIndex,
              column,
            })),
          ];
        } else {
          return [{ type: "FIELD", field, fieldIndex }];
        }
      },
    );

    const _value = isMulti
      ? (value as OptionType[]).map((v) => mapValue(v, options)!)
      : mapValue(value as [OptionType, number] | OptionType | null, options);
    return { options, _value };
  }, [fields, indices, expandFields, value]);

  const handleChange = useCallback(
    (
      value: OnChangeValue<PetitionFieldSelectOption<OptionType>, IsMulti>,
      actionMeta: ActionMeta<PetitionFieldSelectOption<OptionType>>,
    ) => {
      if (isMulti) {
        onChange(
          (value as PetitionFieldSelectOption<OptionType>[]).map(unMapValue) as any,
          actionMeta as any,
        );
      } else {
        onChange(
          unMapValue(value as PetitionFieldSelectOption<OptionType> | null) as any,
          actionMeta as any,
        );
      }
    },
    [onChange, isMulti],
  );

  return (
    <Select
      options={options}
      isMulti={isMulti}
      value={_value as any}
      onChange={handleChange as any}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      {...(props as any)}
      {...rsProps}
    />
  );
}

PetitionFieldSelect.fragments = {
  PetitionField: gql`
    fragment PetitionFieldSelect_PetitionField on PetitionField {
      id
      type
      title
      options
    }
  `,
};

type PetitionFieldSelectOption<T extends PetitionFieldSelectSelection> =
  | {
      type: "FIELD";
      field: T;
      fieldIndex: PetitionFieldIndex;
    }
  | {
      type: "DYNAMIC_SELECT_OPTION";
      field: T;
      fieldIndex: PetitionFieldIndex;
      column: number;
    };

const PetitionFieldSelectItem = memo(function PetitionFieldSelectItem<
  T extends PetitionFieldSelectSelection,
>({ option, highlight }: { option: PetitionFieldSelectOption<T>; highlight?: string }) {
  const color = usePetitionFieldTypeColor(option.field.type);
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
  } else {
    const { field, fieldIndex, column } = option;
    const options = field.options as FieldOptions["DYNAMIC_SELECT"];
    const label = options.labels[column];
    return (
      <>
        <Center
          marginLeft="18px"
          height="20px"
          width="26px"
          fontSize="xs"
          borderRadius="sm"
          border="1px solid"
          borderColor={color}
        >
          {fieldIndex}
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(column)}
        </Center>
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
  }
});

const getOptionValue = (option: PetitionFieldSelectOption<any>) => {
  return option.type === "FIELD" ? option.field.id : `${option.field.id}-${option.column}`;
};

const getOptionLabel = (option: PetitionFieldSelectOption<any>) => {
  if (option.type === "FIELD") {
    return option.field.title ?? "";
  } else {
    const options = option.field.options as FieldOptions["DYNAMIC_SELECT"];
    const label = options.labels[option.column];
    return `${option.field.title ?? ""} ${label}`;
  }
};

function mapValue<T extends PetitionFieldSelectSelection>(
  value: [T, number] | T | null,
  options: PetitionFieldSelectOption<T>[],
) {
  const [field, column]: [T | null | undefined] | [T, number | undefined] = (
    Array.isArray(value) ? value : [value]
  ) as any;
  const _value = !field
    ? null
    : column !== undefined
    ? options.find(
        (o) => o.type === "DYNAMIC_SELECT_OPTION" && o.field.id === field.id && o.column === column,
      ) ?? null
    : options.find((o) => o.type === "FIELD" && o.field.id === field.id) ?? null;
  return _value;
}

function unMapValue<T extends PetitionFieldSelectSelection>(
  value: PetitionFieldSelectOption<T> | null,
) {
  return isDefined(value)
    ? value.type === "FIELD"
      ? value.field
      : ([value.field, value.column] as [T, number])
    : null;
}

function SingleValue(props: SingleValueProps<PetitionFieldSelectOption<any>>) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <PetitionFieldSelectItem
          option={props.data}
          highlight={props.selectProps.inputValue ?? ""}
        />
      </Flex>
    </components.SingleValue>
  );
}

function MultiValueLabel({ children, ...props }: MultiValueProps<PetitionFieldSelectOption<any>>) {
  return (
    <components.MultiValueLabel {...props}>
      <Flex flexWrap="nowrap">
        <PetitionFieldSelectItem
          option={props.data}
          highlight={props.selectProps.inputValue ?? ""}
        />
      </Flex>
    </components.MultiValueLabel>
  );
}

function Option(props: OptionProps<PetitionFieldSelectOption<any>>) {
  return (
    <components.Option {...props}>
      <PetitionFieldSelectItem option={props.data} highlight={props.selectProps.inputValue ?? ""} />
    </components.Option>
  );
}
