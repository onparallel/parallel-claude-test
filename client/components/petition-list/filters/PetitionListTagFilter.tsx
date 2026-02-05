import { gql } from "@apollo/client";
import {
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  Grid,
  HStack,
  IconButton,
  Stack,
} from "@chakra-ui/react";
import { CloseIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { TagSelect } from "@parallel/components/common/TagSelect";
import {
  PetitionTagFilter,
  PetitionTagFilterLineOperator,
  PetitionTagFilterLogicalOperator,
} from "@parallel/graphql/__types";
import { object } from "@parallel/utils/queryState";
import { useLogicalOperators } from "@parallel/utils/useLogicalOperators";
import { useMemo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { Text } from "@parallel/components/ui";

export function PetitionListTagFilter() {
  const { control, setValue, watch } = useFormContext<{
    filter: PetitionTagFilter | undefined;
  }>();

  const { fields: filters, append, remove } = useFieldArray({ control, name: "filter.filters" });

  const logicalOperators = useLogicalOperators();

  const handleAddFilter = () => {
    const value = watch();
    if (isNullish(value.filter?.operator)) {
      setValue("filter.operator", "AND");
    }
    append({ operator: "CONTAINS", value: [] });
  };

  return (
    <Stack width="280px">
      {filters.length ? (
        <Grid templateColumns="32px 240px" alignItems="center" columnGap={2} rowGap={2}>
          {filters.map((f, index) => {
            return (
              <PetitionListTagFilterLine key={f.id} index={index} onRemove={() => remove(index)} />
            );
          })}
        </Grid>
      ) : (
        <Text textStyle="hint" textAlign="center" fontSize="sm">
          <FormattedMessage
            id="generic.no-filter-applied"
            defaultMessage="No filter is being applied."
          />
        </Text>
      )}

      {filters.length > 1 ? (
        <Flex justifyContent="flex-start">
          <Button
            variant="ghost"
            size="sm"
            paddingX={2}
            fontWeight="normal"
            leftIcon={<PlusCircleFilledIcon color="primary.500" position="relative" boxSize={5} />}
            onClick={handleAddFilter}
            isDisabled={filters.length >= 5}
          >
            <FormattedMessage id="generic.add-filter" defaultMessage="Add filter" />
          </Button>
        </Flex>
      ) : null}
      <HStack>
        {filters.length > 1 ? (
          <Controller
            control={control}
            name="filter.operator"
            render={({ field }) => (
              <SimpleSelect size="sm" isSearchable={false} options={logicalOperators} {...field} />
            )}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            paddingX={2}
            fontWeight="normal"
            leftIcon={<PlusCircleFilledIcon color="primary.500" position="relative" boxSize={5} />}
            onClick={handleAddFilter}
            isDisabled={filters.length >= 5}
          >
            <FormattedMessage id="generic.add-filter" defaultMessage="Add filter" />
          </Button>
        )}

        <Spacer />
        <ButtonGroup spacing={2}>
          <Button size="sm" onClick={() => setValue("filter.filters", [])}>
            <FormattedMessage id="generic.clear" defaultMessage="Clear" />
          </Button>
          <Button type="submit" colorScheme="primary" size="sm">
            <FormattedMessage id="generic.apply" defaultMessage="Apply" />
          </Button>
        </ButtonGroup>
      </HStack>
    </Stack>
  );
}

const _fragments = {
  Tag: gql`
    fragment PetitionListTagFilter_Tag on Tag {
      id
      ...Tag_Tag
    }
  `,
};

interface PetitionListTagFilterLineProps {
  index: number;
  onRemove: () => void;
  rootPath?: string;
}

export function PetitionListTagFilterLine({
  index,
  onRemove,
  rootPath = "filter",
}: PetitionListTagFilterLineProps) {
  const path = `${rootPath}.filters.${index}` as const;
  const intl = useIntl();

  const { setValue, setFocus, control, watch } = useFormContext<{
    [key: string]: PetitionTagFilter | undefined;
  }>();
  const operator = watch(`${path}.operator`);
  const operators = useMemo<SimpleOption<PetitionTagFilterLineOperator>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.petition-list-tag-filter.contains",
          defaultMessage: "contains",
        }),
        value: "CONTAINS",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-tag-filter.does-not-contain",
          defaultMessage: "does not contain",
        }),
        value: "DOES_NOT_CONTAIN",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-tag-filter.is-empty",
          defaultMessage: "is empty",
        }),
        value: "IS_EMPTY",
      },
    ];
  }, [intl.locale]);

  return (
    <>
      <IconButton
        variant="ghost"
        icon={<CloseIcon boxSize={3} />}
        aria-label={intl.formatMessage({
          id: "generic.remove",
          defaultMessage: "Remove",
        })}
        size="sm"
        onClick={onRemove}
      />

      <Controller
        control={control}
        name={`${path}.operator`}
        render={({ field: { onChange: _, ...field } }) => (
          <SimpleSelect
            size="sm"
            isSearchable={false}
            options={operators}
            {...field}
            onChange={(operator) => {
              setValue(`${path}.operator`, operator!);
              if (operator === "IS_EMPTY") {
                setValue(`${path}.value`, []);
              }
              setTimeout(() => setFocus(`${path}.value`));
            }}
          />
        )}
      />

      {operator !== "IS_EMPTY" ? (
        <Controller
          control={control}
          name={`${path}.value`}
          rules={{ required: true }}
          render={({ field: { onChange, ...field }, fieldState: { error } }) => (
            <FormControl gridColumn="2" isInvalid={isNonNullish(error)}>
              <TagSelect
                size="sm"
                isMulti
                {...field}
                maxItems={10}
                onChange={(tags) => onChange(tags.map((tag) => tag.id))}
              />

              <FormErrorMessage>
                {error?.type === "required" ? (
                  <FormattedMessage
                    id="generic.required-field-error"
                    defaultMessage="The field is required"
                  />
                ) : null}
              </FormErrorMessage>
            </FormControl>
          )}
        />
      ) : null}
    </>
  );
}

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
    isDefault(data) {
      return data.filters.length === 0;
    },
  });
}
