import { gql } from "@apollo/client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  PetitionFieldSelect_PetitionFieldFragment,
  PetitionFieldSelect_PetitionFieldInnerFragment,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex, useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { UnwrapArray } from "@parallel/utils/types";
import { memo, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, {
  ActionMeta,
  CSSObjectWithLabel,
  MultiValueProps,
  OnChangeValue,
  OptionProps,
  SingleValue as SV,
  SingleValueProps,
  components,
} from "react-select";
import { isDefined, zip } from "remeda";

type PetitionFieldSelection = PetitionFieldSelect_PetitionFieldFragment;

type ChildOf<T extends PetitionFieldSelection> = UnwrapArray<
  Exclude<T["children"], null | undefined>
>;

export interface PetitionFieldSelectProps<
  OptionType extends PetitionFieldSelection,
  IsMulti extends boolean = false,
> extends CustomSelectProps<Exclude<OptionType, "children">, IsMulti, never> {
  fields: OptionType[];
  filterFields?: (field: OptionType | ChildOf<OptionType>) => boolean;
  expandFieldGroups?: boolean;
}

export function PetitionFieldSelect<
  OptionType extends PetitionFieldSelection,
  IsMulti extends boolean = false,
>({
  value,
  onChange,
  fields,
  isMulti,
  filterFields,
  expandFieldGroups,
  ...props
}: PetitionFieldSelectProps<OptionType, IsMulti>) {
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

  const fieldsWithIndices = useFieldsWithIndices(fields);
  const { options, _value } = useMemo(() => {
    let options = fieldsWithIndices.flatMap(([field, fieldIndex, childrenFieldIndices]) => {
      if (field.type === "FIELD_GROUP" && expandFieldGroups) {
        return [
          { field: field, fieldIndex },
          ...zip(field.children!, childrenFieldIndices!).map(([field, fieldIndex]) => ({
            field: field as ChildOf<OptionType>,
            fieldIndex,
          })),
        ];
      } else {
        return { field, fieldIndex };
      }
    });
    if (isDefined(filterFields)) {
      options = options.filter(({ field }) => filterFields(field));
    }

    const _value = isMulti
      ? (value as OptionType[]).map((v) => mapValue(v, options)!)
      : mapValue(value as OptionType | null, options);
    return { options, _value };
  }, [fields, value]);

  const handleChange = useCallback(
    (
      value: OnChangeValue<PetitionFieldSelectOption<OptionType>, IsMulti>,
      actionMeta: ActionMeta<PetitionFieldSelectOption<OptionType>>,
    ) => {
      if (isMulti) {
        onChange(
          (value as PetitionFieldSelectOption<OptionType>[]).map(
            (value) => value?.field ?? null,
          ) as any,
          actionMeta as any,
        );
      } else {
        onChange(
          ((value as SV<PetitionFieldSelectOption<OptionType>>)?.field ?? null) as any,
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
      ...PetitionFieldSelect_PetitionFieldInner
      children {
        ...PetitionFieldSelect_PetitionFieldInner
      }
    }
    fragment PetitionFieldSelect_PetitionFieldInner on PetitionField {
      id
      type
      title
      options
      parent {
        id
      }
    }
  `,
};

interface PetitionFieldSelectOption<T extends PetitionFieldSelect_PetitionFieldInnerFragment> {
  field: T;
  fieldIndex: PetitionFieldIndex;
}

const PetitionFieldSelectItem = memo(function PetitionFieldSelectItem<
  T extends PetitionFieldSelection,
>({
  option,
  highlight,
  indent,
}: {
  option: PetitionFieldSelectOption<T>;
  highlight?: string;
  indent?: boolean;
}) {
  const { field, fieldIndex } = option;
  return (
    <>
      <PetitionFieldTypeIndicator
        as="div"
        type={field.type}
        fieldIndex={fieldIndex}
        isTooltipDisabled
        flexShrink={0}
        marginStart={field.parent && indent ? 2 : 0}
      />
      <Box
        fontSize="sm"
        marginStart={2}
        paddingEnd={1}
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
});

const getOptionValue = (option: PetitionFieldSelectOption<any>) => {
  return option.field.id;
};

const getOptionLabel = (option: PetitionFieldSelectOption<any>) => {
  return option.field.title ?? "";
};

function mapValue<T extends { field: { id: string } }>(value: { id: string } | null, options: T[]) {
  return value ? options.find((o) => o.field.id === value.id) ?? null : null;
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
      <PetitionFieldSelectItem
        option={props.data}
        highlight={props.selectProps.inputValue ?? ""}
        indent
      />
    </components.Option>
  );
}
