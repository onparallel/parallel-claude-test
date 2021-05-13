import { gql } from "@apollo/client";
import { Box, Center, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { PetitionFieldSelect_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import {
  FieldOptions,
  usePetitionFieldTypeColor,
} from "@parallel/utils/petitionFields";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import {
  CustomSelectProps,
  SelectProps,
} from "@parallel/utils/react-select/types";
import { memo, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { components } from "react-select";
import { zip } from "remeda";

export interface PetitionFieldSelectProps<
  T extends PetitionFieldSelect_PetitionFieldFragment,
  ExpandFields extends boolean
> extends CustomSelectProps<ExpandFields extends true ? T | [T, number] : T> {
  fields: T[];
  indices: PetitionFieldIndex[];
  expandFields?: ExpandFields;
}

export function PetitionFieldSelect<
  T extends PetitionFieldSelect_PetitionFieldFragment,
  ExpandFields extends boolean
>({
  value,
  onChange,
  fields,
  indices,
  expandFields,
  ...props
}: PetitionFieldSelectProps<T, ExpandFields>) {
  const intl = useIntl();
  const rsProps =
    useReactSelectProps<PetitionFieldSelectOption<T>, any, never>(props);
  const fieldSelectProps = useMemo<
    SelectProps<PetitionFieldSelectOption<T>, any, never>
  >(
    () => ({
      ...rsProps,
      components: {
        ...rsProps.components,
        Option: ({ children, ...props }) => {
          return (
            <components.Option {...props}>
              <PetitionFieldSelectItem
                option={props.data as PetitionFieldSelectOption<T>}
                highlight={props.selectProps.inputValue ?? ""}
              />
            </components.Option>
          );
        },
        SingleValue: ({ children, ...props }) => {
          return (
            <components.SingleValue {...props}>
              <PetitionFieldSelectItem
                option={props.data}
                highlight={props.selectProps.inputValue ?? ""}
              />
            </components.SingleValue>
          );
        },
      },
      styles: {
        ...rsProps.styles,
        singleValue: (styles) => {
          return {
            maxWidth: "calc(100% - 6px)",
            display: "flex",
            flex: "0 1 auto",
            alignItems: "center",
          };
        },
      },
      getOptionValue(option) {
        return option.type === "FIELD"
          ? option.field.id
          : `${option.field.id}-${option.column}`;
      },
      getOptionLabel(option) {
        if (option.type === "FIELD") {
          return option.field.title ?? "";
        } else {
          const options = option.field
            .options as FieldOptions["DYNAMIC_SELECT"];
          const label = options.labels[option.column];
          return `${option.field.title ?? ""} ${label}`;
        }
      },
    }),
    [rsProps, expandFields, fields, indices]
  );
  const { options, _value } = useMemo(() => {
    const options: PetitionFieldSelectOption<T>[] = zip(
      fields,
      indices
    ).flatMap(([field, fieldIndex]) => {
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
    });
    const [field, column]: [T | null | undefined] | [T, number | undefined] = (
      Array.isArray(value) ? value : [value]
    ) as any;
    const _value = !field
      ? null
      : column !== undefined
      ? options.find(
          (o) =>
            o.type === "DYNAMIC_SELECT_OPTION" &&
            o.field.id === field.id &&
            o.column === column
        ) ?? null
      : options.find((o) => o.type === "FIELD" && o.field.id === field.id) ??
        null;
    return { options, _value };
  }, [fields, indices, expandFields, value]);
  const handleChange = useCallback(
    (value: PetitionFieldSelectOption<T>) => {
      if (value.type === "FIELD") {
        onChange(value.field as any);
      } else {
        onChange([value.field, value.column] as any);
      }
    },
    [onChange]
  );
  return (
    <Select
      {...fieldSelectProps}
      options={options}
      value={_value}
      onChange={handleChange as any}
      placeholder={intl.formatMessage({
        id: "component.petition-field-select.placeholder",
        defaultMessage: "Select a field",
      })}
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

type PetitionFieldSelectOption<
  T extends PetitionFieldSelect_PetitionFieldFragment
> =
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
  T extends PetitionFieldSelect_PetitionFieldFragment
>({
  option,
  highlight,
}: {
  option: PetitionFieldSelectOption<T>;
  highlight?: string;
}) {
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
          isTruncated
        >
          {field.title ? (
            highlight ? (
              <HighlightText text={field.title} search={highlight} />
            ) : (
              field.title
            )
          ) : (
            <Text as="span" textStyle="hint">
              <FormattedMessage
                id="generic.untitled-field"
                defaultMessage="Untitled field"
              />
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
        <Box
          fontSize="sm"
          marginLeft={2}
          paddingRight={1}
          flex="1"
          minWidth="0"
          isTruncated
        >
          {highlight ? (
            <HighlightText text={label} search={highlight} />
          ) : (
            label
          )}
        </Box>
      </>
    );
  }
});
