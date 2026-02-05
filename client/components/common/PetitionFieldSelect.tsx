import { gql } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { PetitionFieldSelect_PetitionBaseFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex, useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { UseReactSelectProps, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { If, UnwrapArray } from "@parallel/utils/types";
import { memo, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, {
  ActionMeta,
  CSSObjectWithLabel,
  MultiValueProps,
  OnChangeValue,
  OptionProps,
  SingleValue as SV,
  Props as SelectProps,
  SingleValueProps,
  components,
} from "react-select";
import { isNonNullish, zip } from "remeda";
import { Text } from "@parallel/components/ui";

type FieldOf<T extends PetitionFieldSelect_PetitionBaseFragment> = UnwrapArray<
  Exclude<T["fields"], null | undefined>
>;

type ChildOf<T extends FieldOf<PetitionFieldSelect_PetitionBaseFragment>> = UnwrapArray<
  Exclude<T["children"], null | undefined>
>;

type AnyFieldOf<T extends PetitionFieldSelect_PetitionBaseFragment> =
  | FieldOf<T>
  | ChildOf<FieldOf<T>>;

interface PetitionFieldSelectOption<T extends PetitionFieldSelect_PetitionBaseFragment> {
  field: AnyFieldOf<T>;
  fieldIndex: PetitionFieldIndex;
}

type ValueType<T, IsMulti extends boolean> = If<IsMulti, T[], T | null>;

export interface PetitionFieldSelectProps<
  T extends PetitionFieldSelect_PetitionBaseFragment,
  IsMulti extends boolean = false,
> extends UseReactSelectProps<PetitionFieldSelectOption<T>, IsMulti, never>,
    Omit<SelectProps<PetitionFieldSelectOption<T>, IsMulti, never>, "value" | "onChange"> {
  value: ValueType<AnyFieldOf<T>, IsMulti>;
  onChange: (value: ValueType<AnyFieldOf<T>, IsMulti>, actionMeta: ActionMeta<any>) => void;
  petition: T;
  filterFields?: (field: AnyFieldOf<T>) => boolean;
  expandFieldGroups?: boolean;
}

export function PetitionFieldSelect<
  T extends PetitionFieldSelect_PetitionBaseFragment,
  IsMulti extends boolean = false,
>({
  value,
  onChange,
  petition,
  isMulti,
  filterFields,
  expandFieldGroups,
  ...props
}: PetitionFieldSelectProps<T, IsMulti>) {
  const intl = useIntl();
  const rsProps = useReactSelectProps<PetitionFieldSelectOption<T>, IsMulti, never>({
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

  const fieldsWithIndices = useFieldsWithIndices(petition);
  const { options, _value } = useMemo(() => {
    let options: PetitionFieldSelectOption<T>[] = fieldsWithIndices.flatMap(
      ([field, fieldIndex, childrenFieldIndices]) => {
        if (field.type === "FIELD_GROUP" && expandFieldGroups) {
          return [
            { field: field, fieldIndex },
            ...zip(field.children!, childrenFieldIndices!).map(([field, fieldIndex]) => ({
              field: field as ChildOf<FieldOf<T>>,
              fieldIndex,
            })),
          ];
        } else {
          return { field, fieldIndex };
        }
      },
    );
    if (isNonNullish(filterFields)) {
      options = options.filter(({ field }) => filterFields(field));
    }

    const _value = isMulti
      ? (value as AnyFieldOf<T>[]).map((v) => mapValue(v, options)!)
      : mapValue(value as AnyFieldOf<T> | null, options);
    return { options, _value };
  }, [petition.fields, value]);

  const handleChange = useCallback(
    (
      value: OnChangeValue<PetitionFieldSelectOption<T>, IsMulti>,
      actionMeta: ActionMeta<PetitionFieldSelectOption<T>>,
    ) => {
      if (isMulti) {
        onChange(
          (value as PetitionFieldSelectOption<T>[]).map((value) => value?.field ?? null) as any,
          actionMeta as any,
        );
      } else {
        onChange(
          ((value as SV<PetitionFieldSelectOption<T>>)?.field ?? null) as any,
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

const _fragments = {
  PetitionBase: gql`
    fragment PetitionFieldSelect_PetitionBase on PetitionBase {
      fields {
        id
        ...PetitionFieldSelect_PetitionFieldInner
        children {
          id
          ...PetitionFieldSelect_PetitionFieldInner
        }
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

const PetitionFieldSelectItem = memo(function PetitionFieldSelectItem<
  T extends PetitionFieldSelect_PetitionBaseFragment,
>({
  label,
  option,
  highlight,
  indent,
}: {
  label: string;
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
        {label ? (
          <HighlightText as="span" search={highlight}>
            {label}
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

const getOptionValue = (
  option: PetitionFieldSelectOption<PetitionFieldSelect_PetitionBaseFragment>,
) => {
  return option.field.id;
};

const getOptionLabel = (
  option: PetitionFieldSelectOption<PetitionFieldSelect_PetitionBaseFragment>,
) => {
  return option.field.title ?? "";
};

function mapValue<T extends { field: { id: string } }>(value: { id: string } | null, options: T[]) {
  return value ? (options.find((o) => o.field.id === value.id) ?? null) : null;
}

function SingleValue(
  props: SingleValueProps<PetitionFieldSelectOption<PetitionFieldSelect_PetitionBaseFragment>>,
) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <PetitionFieldSelectItem
          label={props.children as string}
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
          label={children as string}
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
        label={props.children as string}
        option={props.data}
        highlight={props.selectProps.inputValue ?? ""}
        indent
      />
    </components.Option>
  );
}
