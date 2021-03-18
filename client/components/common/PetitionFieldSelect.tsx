import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { PetitionFieldSelect_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import {
  CustomSelectProps,
  SelectProps,
} from "@parallel/utils/react-select/types";
import { memo, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { components } from "react-select";

export interface PetitionFieldSelectProps<
  T extends PetitionFieldSelect_PetitionFieldFragment
> extends CustomSelectProps<T> {
  fields: T[];
  indices: PetitionFieldIndex[];
}

const FieldItem = memo(function FieldItem({
  field,
  fieldIndex,
  highlight,
}: {
  field: PetitionFieldSelect_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  highlight?: string;
}) {
  return (
    <>
      <PetitionFieldTypeIndicator
        as="div"
        type={field.type}
        fieldIndex={fieldIndex}
        isTooltipDisabled
        flexShrink={0}
      />
      <Box marginLeft={2} paddingRight={1} flex="1" minWidth="0" isTruncated>
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
});

export function PetitionFieldSelect<
  T extends PetitionFieldSelect_PetitionFieldFragment
>({ value, onChange, fields, indices, ...props }: PetitionFieldSelectProps<T>) {
  const intl = useIntl();
  const rsProps = useReactSelectProps<T, any, never>(props);
  const fieldSelectProps = useMemo<SelectProps<T, any, never>>(
    () => ({
      ...rsProps,
      components: {
        ...rsProps.components,
        Option: ({ children, ...props }) => {
          const field = props.data as T;
          const index = indices[fields!.findIndex((f) => f.id === field.id)];
          return (
            <components.Option {...props}>
              <FieldItem
                field={field}
                fieldIndex={index}
                highlight={props.selectProps.inputValue ?? ""}
              />
            </components.Option>
          );
        },
        SingleValue: ({ children, ...props }) => {
          const field = props.data as T;
          const index = indices[fields!.findIndex((f) => f.id === field.id)];
          return (
            <components.SingleValue {...props}>
              <FieldItem field={field} fieldIndex={index} />
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
      getOptionValue(field) {
        return field.id;
      },
      getOptionLabel(field) {
        return field.title ?? "";
      },
    }),
    [rsProps, fields, indices]
  );
  return (
    <Select
      {...fieldSelectProps}
      options={fields}
      value={value}
      onChange={onChange as any}
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
    }
  `,
};
