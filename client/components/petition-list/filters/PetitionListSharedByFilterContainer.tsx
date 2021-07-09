import { Box, Button, Grid, Text } from "@chakra-ui/react";
import { PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionListSharedByFilter } from "./PetitionListSharedByFilter";

export type FilterSharedByFilter = {
  id: number;
  operator: string;
  value: any;
};

export type FilterSharedBy = {
  logicalOperator: string;
  filters: FilterSharedByFilter[];
};

export const PetitionListSharedByFilterContainer = ({
  value,
  onChange,
}: ValueProps<FilterSharedBy>) => {
  const intl = useIntl();

  const counter = useRef(0);

  const operators = useMemo(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.shared-filter.is",
          defaultMessage: "is",
        }),
        value: "IS",
      },
      {
        label: intl.formatMessage({
          id: "component.shared-filter.it-is-not",
          defaultMessage: "it is not",
        }),
        value: "IS_NOT",
      },
      {
        label: intl.formatMessage({
          id: "component.shared-filter.is-owner",
          defaultMessage: "is owner",
        }),
        value: "IS_OWNER",
      },
    ];
  }, [intl.locale]);

  const logicalOperators = useMemo(() => {
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

  const handleAddFilter = () => {
    counter.current++;
    onChange({
      logicalOperator: value?.logicalOperator ?? "AND",
      filters: [
        ...(value?.filters ?? []),
        {
          id: counter.current,
          operator: "IS",
          value: "",
        },
      ],
    });
  };

  type EventSelect = { label: string; value: string };

  const handleChangeLogicalOperator = (event: EventSelect) => {
    onChange({
      logicalOperator: event.value,
      filters: [...(value?.filters ?? [])],
    });
  };

  const handleChangeOperator = (event: EventSelect, index: number) => {
    const _value = {
      logicalOperator: value?.logicalOperator ?? "AND",
      filters: [...(value?.filters ?? [])],
    };
    _value.filters[index].operator = event.value;
    onChange(_value);
  };

  const handleChangeValue = (userOrGroup: any, index: number) => {
    const _value = {
      logicalOperator: value?.logicalOperator ?? "AND",
      filters: [...(value?.filters ?? [])],
    };
    _value.filters[index].value = userOrGroup;
    onChange(_value);
  };

  const handleRemoveFilter = (index: number) => {
    const _value = {
      logicalOperator: value?.logicalOperator ?? "AND",
      filters: [...(value?.filters ?? [])],
    };
    _value.filters.splice(index, 1);

    onChange(_value);
  };

  return (
    <Box padding={2} paddingBottom={0} fontSize="14px">
      <Text
        as="h1"
        fontWeight="semibold"
        color="gray.600"
        textTransform="uppercase"
        marginBottom={1.5}
      >
        <FormattedMessage id="common.filter" defaultMessage="Filter" />
      </Text>
      {value?.filters.length ? (
        <Grid
          templateColumns={"auto auto 1fr"}
          alignItems="center"
          columnGap={2}
          rowGap={3}
        >
          {value.filters.map((filter, index) => {
            return (
              <PetitionListSharedByFilter
                key={filter.id}
                index={index}
                logicalOperators={index ? logicalOperators : undefined}
                logicalOperator={value.logicalOperator}
                operators={operators}
                operator={filter.operator}
                value={filter?.value ?? ""}
                onChangeValue={handleChangeValue}
                onChangeLogicalOperator={handleChangeLogicalOperator}
                onChangeOperator={handleChangeOperator}
                onRemoveFilter={handleRemoveFilter}
              />
            );
          })}
        </Grid>
      ) : (
        <Text color="gray.500" fontSize="16px" fontStyle="italic">
          <FormattedMessage
            id="common.no-filter-applied"
            defaultMessage="No filter is being applied."
          />
        </Text>
      )}

      <Button
        paddingLeft={0.5}
        marginY={2}
        fontWeight="normal"
        fontSize="16px"
        backgroundColor="transparent"
        _hover={{ backgroundColor: "transparent", color: "purple.700" }}
        _active={{ backgroundColor: "transparent", color: "purple.700" }}
        leftIcon={
          <PlusCircleFilledIcon
            color="purple.500"
            position="relative"
            fontSize="18px"
          />
        }
        alignSelf="start"
        onClick={handleAddFilter}
        isDisabled={(value?.filters?.length ?? 0) > 4}
      >
        <FormattedMessage
          id="component.shared-filter.add-filter"
          defaultMessage="Add filter"
        />
      </Button>
    </Box>
  );
};

export function flatShared(data: FilterSharedBy): string[] {
  const flatted = [];

  flatted[flatted.length] = data.logicalOperator;
  data.filters.forEach(
    (filter: { id: number; operator: string; value: any }) => {
      if (filter.operator) {
        flatted[flatted.length] = filter.id;
        flatted[flatted.length] = filter.operator;
        flatted[flatted.length] = filter.value;
      }
    }
  );

  return flatted;
}

export function unflatShared(data: string[]): FilterSharedBy {
  const unflatten = {} as FilterSharedBy;
  let counter = 0;
  let filter = {} as FilterSharedByFilter;

  data.forEach((element, index) => {
    if (!index) {
      unflatten.logicalOperator = element;
      unflatten.filters = [];
    } else {
      counter++;
      if (counter === 1) filter.id = Number(element);
      if (counter === 2) filter.operator = element;
      if (counter === 3) {
        filter.value = element;
        unflatten.filters.push(filter);
        counter = 0;
        filter = {} as FilterSharedByFilter;
      }
    }
  });

  return unflatten;
}
