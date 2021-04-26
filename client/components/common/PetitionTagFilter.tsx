import { gql } from "@apollo/client";
import { Center, Checkbox, Skeleton, Text } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import {
  PetitionTagFilter_TagFragment,
  usePetitionTagFilter_tagsQuery,
} from "@parallel/graphql/__types";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import Select, { ActionMeta, components, createFilter } from "react-select";
import { Tag } from "./Tag";

type TagSelection = PetitionTagFilter_TagFragment;

export type PetitionTagFilterProps = ValueProps<string[]>;

export function PetitionTagFilter({ value, onChange }: PetitionTagFilterProps) {
  const { data, refetch } = usePetitionTagFilter_tagsQuery();
  const tags = data?.tags.items ?? [];
  const options = useMemo(
    () =>
      [
        { __type: "CLEAR_FILTER" },
        { __type: "WITHOUT_TAGS" },
        ...tags,
      ] as TagSelection[],
    [tags]
  );
  const rsProps = useReactSelectProps<TagSelection, true, never>(
    useMemo(
      () => ({
        components: {
          Option: (props) => {
            const value = props.selectProps.value;
            return props.data.__type === "CLEAR_FILTER" ? (
              <components.Option {...props}>
                <Center boxSize="16px" marginRight={2} alignSelf="center">
                  <CloseIcon fontSize="12px" />
                </Center>
                <FormattedMessage
                  id="components.petition-tag-filter.clear-filter"
                  defaultMessage="Clear filter"
                />
              </components.Option>
            ) : props.data.__type === "WITHOUT_TAGS" ? (
              <components.Option {...props}>
                <Checkbox
                  isChecked={value?.length === 0}
                  marginRight={2}
                  role="presentation"
                  pointerEvents="none"
                />
                <FormattedMessage
                  id="components.petition-tag-filter.without-tags"
                  defaultMessage="Without tags"
                />
              </components.Option>
            ) : (
              <components.Option {...props}>
                <Checkbox
                  isChecked={props.isSelected}
                  marginRight={2}
                  role="presentation"
                  pointerEvents="none"
                />
                <Tag
                  flex="0 1 auto"
                  minWidth="0"
                  tag={props.data as TagSelection}
                />
              </components.Option>
            );
          },
          ValueContainer: ({ children, ...props }) => {
            const value = props.selectProps.value;
            const input =
              (children as any[])?.find((c) => c?.type === components.Input) ??
              null;
            return (
              <components.ValueContainer {...props}>
                {(children as any[])?.[0] ? (
                  <>
                    {value === null ? (
                      <Text whiteSpace="nowrap" fontWeight="bold">
                        <FormattedMessage
                          id="components.petition-tag-filter.no-filter"
                          defaultMessage="Filter by tags"
                        />
                      </Text>
                    ) : value.length === 0 ? (
                      <Text whiteSpace="nowrap" fontWeight="bold">
                        <FormattedMessage
                          id="components.petition-tag-filter.without-tags"
                          defaultMessage="Without tags"
                        />
                      </Text>
                    ) : value.length === 1 ? (
                      props.getValue()[0] ? (
                        <Tag tag={props.getValue()[0]} minWidth="0" />
                      ) : (
                        <Skeleton
                          borderRadius="full"
                          height="24px"
                          width="80px"
                        />
                      )
                    ) : (
                      <Text color="purple.600">
                        <FormattedMessage
                          id="components.petition-tag-filter.n-tags"
                          defaultMessage="{count} tags"
                          values={{ count: value.length }}
                        />
                      </Text>
                    )}
                  </>
                ) : null}
                {input}
              </components.ValueContainer>
            );
          },
        },
        styles: {
          container: (styles) => ({
            ...styles,
            minWidth: "180px",
            maxWidth: "210px",
          }),
          valueContainer: (styles) => ({
            ...styles,
            flexWrap: "nowrap",
            paddingLeft: "1rem",
          }),
          option: (styles, { isFocused, theme }) => ({
            ...styles,
            display: "flex",
            padding: "0.25rem 1rem",
            fontSize: "14px",
            color: "inherit",
            backgroundColor: isFocused ? theme.colors.primary25 : "transparent",
            whiteSpace: "nowrap",
          }),
        },
      }),
      []
    )
  );

  const handleChange = function (_: any, action: ActionMeta<TagSelection>) {
    switch (action.action) {
      case "select-option":
        if (action.option) {
          if ((action.option as any).__type === "CLEAR_FILTER") {
            onChange(null);
          } else if ((action.option as any).__type === "WITHOUT_TAGS") {
            onChange([]);
          } else {
            onChange([...(value ?? []), action.option.id]);
          }
        }
        break;
      case "deselect-option":
        if (action.option) {
          onChange(
            value?.length === 1
              ? null
              : value?.filter((v) => v !== action.option!.id) ?? null
          );
        }
        break;
      case "pop-value":
      case "remove-value":
        if (action.removedValue) {
          onChange(
            value?.length === 1
              ? null
              : value?.filter((v) => v !== action.removedValue.id) ?? null
          );
        }
        break;
      case "clear":
        onChange(null);
        break;
    }
  };

  const _value = useMemo(
    () => value?.map((v) => options.find((o) => (o as any).id === v)!) ?? null,
    [value, options]
  );

  return (
    <Select
      {...rsProps}
      isMulti
      isClearable={false}
      filterOption={filterOption}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      getOptionValue={(o) => o.id}
      onMenuOpen={() => refetch()}
      getOptionLabel={(o) => o.name}
      options={options}
      value={_value}
      onChange={handleChange}
    />
  );
}

const _filter = createFilter({});
function filterOption(item: any, search: string) {
  if (item.data.__type) {
    return true;
  } else {
    return _filter(item, search);
  }
}

PetitionTagFilter.fragments = {
  Tag: gql`
    fragment PetitionTagFilter_Tag on Tag {
      id
      ...Tag_Tag
    }
    ${Tag.fragments.Tag}
  `,
};

PetitionTagFilter.queries = {
  tags: gql`
    query PetitionTagFilter_tags($search: String) {
      tags(search: $search) {
        items {
          ...PetitionTagListCellContent_Tag
        }
      }
    }
    ${PetitionTagFilter.fragments.Tag}
  `,
};
