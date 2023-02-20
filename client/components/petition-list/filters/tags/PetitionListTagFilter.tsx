import { gql } from "@apollo/client";
import { Button, Grid, HStack, Stack, Text } from "@chakra-ui/react";
import { PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { TableColumnFilterProps } from "@parallel/components/common/Table";
import { Tag } from "@parallel/components/common/Tag";
import { PetitionTagFilter, PetitionTagFilterLogicalOperator } from "@parallel/graphql/__types";
import { object } from "@parallel/utils/queryState";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionListTagFilterLine } from "./PetitionListTagFilterLine";

export function PetitionListTagFilter({
  value,
  onChange,
}: TableColumnFilterProps<PetitionTagFilter>) {
  const intl = useIntl();
  const handleAddFilter = () => {
    onChange({
      operator: value?.operator ?? "AND",
      filters: [
        ...(value?.filters ?? []),
        {
          operator: "CONTAINS",
          value: [],
        },
      ],
    });
  };

  const logicalOperators = useMemo<SimpleOption<PetitionTagFilterLogicalOperator>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.petition-list-shared-with-filter.or",
          defaultMessage: "or",
        }),
        value: "OR",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-shared-with-filter.and",
          defaultMessage: "and",
        }),
        value: "AND",
      },
    ];
  }, [intl.locale]);

  return (
    <Stack paddingX={2} paddingBottom={2}>
      {value?.filters.length ? (
        <Grid
          templateColumns={{
            base: "auto 1fr",
            sm: "auto auto 1fr",
          }}
          alignItems="center"
          columnGap={1}
          rowGap={2}
        >
          {value.filters.map((filter, index) => {
            return (
              <PetitionListTagFilterLine
                key={index}
                value={filter}
                onChange={(line) =>
                  onChange({
                    ...value,
                    filters: value.filters.map((f, i) => (i === index ? line : f)),
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
            id="component.petition-list-shared-with-filter.no-filter"
            defaultMessage="No filter is being applied."
          />
        </Text>
      )}
      <HStack>
        <Button
          variant="outline"
          size="sm"
          fontWeight="normal"
          leftIcon={<PlusCircleFilledIcon color="primary.500" position="relative" boxSize={5} />}
          onClick={handleAddFilter}
          isDisabled={value?.filters && value.filters.length >= 5}
        >
          <FormattedMessage
            id="component.petition-list-shared-with-filter.add-filter"
            defaultMessage="Add filter"
          />
        </Button>
        {value && value.filters.length > 1 ? (
          <SimpleSelect
            size="sm"
            usePortal={false}
            isSearchable={false}
            options={logicalOperators}
            value={value.operator}
            onChange={(operator) => onChange({ ...value!, operator: operator! })}
          />
        ) : null}
      </HStack>
    </Stack>
  );
}

PetitionListTagFilter.fragments = {
  Tag: gql`
    fragment PetitionListTagFilter_Tag on Tag {
      id
      ...Tag_Tag
    }
    ${Tag.fragments.Tag}
  `,
};

export function tagFilterQueryItem() {
  return object<PetitionTagFilter>({
    flatten(data: PetitionTagFilter) {
      return ([data.operator] as any[]).concat(data.filters.flatMap((f) => [f.operator, f.value]));
    },
    unflatten(data: any[]): PetitionTagFilter {
      const value: PetitionTagFilter = {
        operator: data[0] as PetitionTagFilterLogicalOperator,
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
    },
  });
}

export function removeInvalidTagFilterLines(
  value: PetitionTagFilter | null
): PetitionTagFilter | null {
  const filters =
    value?.filters.filter((l) => l.operator === "IS_EMPTY" || l.value.length > 0) ?? [];
  return filters.length > 0 ? { ...value!, filters } : null;
}
