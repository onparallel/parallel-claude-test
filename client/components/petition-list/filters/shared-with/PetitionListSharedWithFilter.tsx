import { Button, Grid, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { TableColumnFilterProps } from "@parallel/components/common/Table";
import { useInlineReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptionType } from "@parallel/utils/react-select/types";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { PetitionListSharedWithFilterLine } from "./PetitionListSharedWithFilterLine";
import {
  FilterSharedWithLogicalOperator,
  PetitionSharedWithFilter,
} from "@parallel/graphql/__types";

export function PetitionListSharedWithFilter({
  value,
  onChange,
}: TableColumnFilterProps<PetitionSharedWithFilter>) {
  const intl = useIntl();

  const logicalOperators = useMemo<
    OptionType<FilterSharedWithLogicalOperator>[]
  >(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.shared-filter.or",
          defaultMessage: "or",
        }),
        value: "OR",
      },
      {
        label: intl.formatMessage({
          id: "component.shared-filter.and",
          defaultMessage: "and",
        }),
        value: "AND",
      },
    ];
  }, [intl.locale]);

  const selectProps = useInlineReactSelectProps<any, false, never>({
    size: "sm",
    usePortal: false,
  });

  const handleAddFilter = () => {
    onChange({
      operator: value?.operator ?? "AND",
      filters: [
        ...(value?.filters ?? []),
        {
          operator: "SHARED_WITH",
          value: null,
        },
      ],
    });
  };

  return (
    <Stack padding={2}>
      <Heading as="h4" size="xs" textTransform="uppercase">
        <FormattedMessage id="common.filter" defaultMessage="Filter" />
      </Heading>
      {value?.filters.length ? (
        <Grid
          templateColumns={"auto auto 1fr"}
          alignItems="center"
          columnGap={2}
          rowGap={3}
        >
          {value.filters.map((filter, index) => {
            return (
              <PetitionListSharedWithFilterLine
                key={index}
                value={filter}
                onChange={(line) =>
                  onChange({
                    ...value,
                    filters: value.filters.map((f, i) =>
                      i === index ? line : f
                    ),
                  })
                }
                onRemove={() =>
                  onChange(
                    value.filters.length === 1
                      ? null
                      : {
                          ...value,
                          filters: value.filters.filter((_, i) => i !== index),
                        }
                  )
                }
              />
            );
          })}
        </Grid>
      ) : (
        <Text textStyle="hint" textAlign="center" minWidth="300px">
          <FormattedMessage
            id="common.no-filter-applied"
            defaultMessage="No filter is being applied."
          />
        </Text>
      )}
      <HStack>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={
            <PlusCircleFilledIcon
              color="purple.500"
              position="relative"
              fontSize="18px"
            />
          }
          onClick={handleAddFilter}
          isDisabled={value?.filters && value.filters.length > 4}
        >
          <FormattedMessage
            id="component.shared-filter.add-filter"
            defaultMessage="Add filter"
          />
        </Button>
        {value && value.filters.length > 1 ? (
          <Select
            {...selectProps}
            options={logicalOperators}
            value={logicalOperators.find((o) => value!.operator === o.value)}
            onChange={(option) =>
              onChange({ ...value!, operator: option!.value })
            }
          />
        ) : null}
      </HStack>
    </Stack>
  );
}

export function flatShared(data: PetitionSharedWithFilter) {
  return ([data.operator] as any[]).concat(
    data.filters.flatMap((f) => [f.operator, f.value])
  );
}

export function unflatShared(data: any[]): PetitionSharedWithFilter {
  const value: PetitionSharedWithFilter = {
    operator: data[0] as FilterSharedWithLogicalOperator,
    filters: [],
  };
  let i = 1;
  while (i < data.length) {
    value.filters.push({
      operator: data[i],
      value: data[i + 1],
    });
    i += 2;
  }
  return value;
}

export function removeInvalidLines(
  value: PetitionSharedWithFilter | null
): PetitionSharedWithFilter | null {
  const filters = value?.filters.filter((l) => l.value !== null) ?? [];
  return filters.length > 0 ? { ...value, filters } : null;
}
