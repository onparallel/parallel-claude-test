import { ButtonGroup, FormControl, FormErrorMessage, Grid, IconButton } from "@chakra-ui/react";
import { CloseIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { Spacer } from "@parallel/components/common/Spacer";
import { Button, Flex, HStack, Stack, Text } from "@parallel/components/ui";
import {
  FilterSharedWithLogicalOperator,
  FilterSharedWithOperator,
  PetitionSharedWithFilter,
  UserSelect_UserGroupFragment,
} from "@parallel/graphql/__types";
import { object } from "@parallel/utils/queryState";
import { useLogicalOperators } from "@parallel/utils/useLogicalOperators";
import { useSearchUserGroups } from "@parallel/utils/useSearchUserGroups";
import { useCallback, useMemo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { useSearchUsers } from "../../../utils/useSearchUsers";
import { UserSelect } from "../../common/UserSelect";

export function PetitionListSharedWithFilter() {
  const { control, setValue, watch } = useFormContext<{
    filter: PetitionSharedWithFilter | undefined;
  }>();

  const logicalOperators = useLogicalOperators();

  const { fields: filters, append, remove } = useFieldArray({ control, name: "filter.filters" });

  const handleAddFilter = () => {
    const value = watch();
    if (isNullish(value.filter?.operator)) {
      setValue("filter.operator", "AND");
    }
    append({ operator: "SHARED_WITH", value: null as any });
  };

  return (
    <Stack width="280px">
      {filters.length ? (
        <Grid templateColumns="32px 240px" alignItems="center" columnGap={2} rowGap={2}>
          {filters.map((f, index) => {
            return (
              <PetitionListSharedWithFilterLine
                key={f.id}
                index={index}
                onRemove={() => remove(index)}
              />
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
            disabled={filters.length >= 5}
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
            disabled={filters.length >= 5}
          >
            <FormattedMessage id="generic.add-filter" defaultMessage="Add filter" />
          </Button>
        )}

        <Spacer />
        <ButtonGroup gap={2}>
          <Button size="sm" onClick={() => setValue("filter.filters", [])}>
            <FormattedMessage id="generic.clear" defaultMessage="Clear" />
          </Button>
          <Button type="submit" colorPalette="primary" size="sm">
            <FormattedMessage id="generic.apply" defaultMessage="Apply" />
          </Button>
        </ButtonGroup>
      </HStack>
    </Stack>
  );
}

interface PetitionListSharedWithFilterProps {
  index: number;
  onRemove: () => void;
  rootPath?: string;
}

export function PetitionListSharedWithFilterLine({
  index,
  onRemove,
  rootPath = "filter",
}: PetitionListSharedWithFilterProps) {
  const path = `${rootPath}.filters.${index}` as const;
  const intl = useIntl();

  const { setValue, setFocus, control, watch } = useFormContext<{
    [key: string]: PetitionSharedWithFilter | undefined;
  }>();
  const operator = watch(`${path}.operator`);

  const searchUsers = useSearchUsers();
  const searchUserGroups = useSearchUserGroups();
  const handleSearchUsersAndGroups = useCallback(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      const [users, groups] = await Promise.all([
        searchUsers(search, {
          excludeIds: excludeUsers,
        }),
        operator !== "IS_OWNER"
          ? searchUserGroups(search, { excludeIds: excludeUserGroups })
          : ([] as UserSelect_UserGroupFragment[]),
      ]);

      return [...groups, ...users];
    },
    [searchUsers, searchUserGroups, operator],
  );

  const operators = useMemo<SimpleOption<FilterSharedWithOperator>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.petition-list-shared-with-filter.shared-with",
          defaultMessage: "is shared with",
        }),
        value: "SHARED_WITH",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-shared-with-filter.not-shared-with",
          defaultMessage: "is not shared with",
        }),
        value: "NOT_SHARED_WITH",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-shared-with-filter.is-owner",
          defaultMessage: "owner is",
        }),
        value: "IS_OWNER",
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
              setValue(`${path}.value`, null as any);
              setFocus(`${path}.value`);
            }}
          />
        )}
      />

      <Controller
        control={control}
        name={`${path}.value`}
        rules={{ required: true }}
        render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
          <FormControl gridColumn="2" isInvalid={isNonNullish(error)}>
            <UserSelect
              size="sm"
              includeGroups={operator !== "IS_OWNER"}
              {...field}
              value={value}
              onChange={(userOrGroup) => onChange(userOrGroup?.id ?? (null as any))}
              onSearch={handleSearchUsersAndGroups}
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
    </>
  );
}

export function sharedWithQueryItem() {
  return object<PetitionSharedWithFilter>({
    flatten(data) {
      return [data.operator, ...data.filters.flatMap((f) => [f.operator, f.value])];
    },
    unflatten(data: string[]) {
      const value: PetitionSharedWithFilter = {
        operator: data[0] as FilterSharedWithLogicalOperator,
        filters: [],
      };
      let i = 1;
      while (i < data.length) {
        value.filters.push({
          operator: data[i] as FilterSharedWithOperator,
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
