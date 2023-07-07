import { Box, CloseButton } from "@chakra-ui/react";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { TagSelect } from "@parallel/components/common/TagSelect";
import { PetitionTagFilterLine, PetitionTagFilterLineOperator } from "@parallel/graphql/__types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export interface PetitionListTagFilterLineProps extends ValueProps<PetitionTagFilterLine, false> {
  onRemove: () => void;
}

export function PetitionListTagFilterLine({
  value,
  onChange,
  onRemove,
}: PetitionListTagFilterLineProps) {
  const intl = useIntl();
  const operators = useMemo<SimpleOption<PetitionTagFilterLineOperator>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.petition-list-tag-filter.contains",
          defaultMessage: "Contains",
        }),
        value: "CONTAINS",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-tag-filter.does-not-contain",
          defaultMessage: "Does not contain",
        }),
        value: "DOES_NOT_CONTAIN",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-tag-filter.is-empty",
          defaultMessage: "Is empty",
        }),
        value: "IS_EMPTY",
      },
    ];
  }, [intl.locale]);

  return (
    <>
      <CloseButton
        gridRow={{ base: value.operator === "IS_EMPTY" ? "auto" : "span 2", sm: "auto" }}
        aria-label={intl.formatMessage({
          id: "generic.remove",
          defaultMessage: "Remove",
        })}
        size="md"
        onClick={onRemove}
      />
      <Box gridColumn={{ base: "auto", sm: value.operator === "IS_EMPTY" ? "span 2" : "auto" }}>
        <SimpleSelect
          size="sm"
          usePortal={false}
          isSearchable={false}
          options={operators}
          value={value.operator}
          onChange={(operator) => {
            onChange(
              operator === "IS_EMPTY" ? { operator, value: [] } : { ...value, operator: operator! },
            );
          }}
        />
      </Box>
      {value.operator !== "IS_EMPTY" ? (
        <Box flex="1" minWidth="240px">
          <TagSelect
            size="sm"
            isMulti
            usePortal={false}
            value={value.value}
            maxItems={10}
            onChange={(tags) => {
              onChange({ ...value, value: tags.map((tag) => tag.id) });
            }}
          />
        </Box>
      ) : null}
    </>
  );
}
