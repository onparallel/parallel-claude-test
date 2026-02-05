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
import {
  PetitionApprovalsFilterInput,
  PetitionApprovalsFilterLogicalOperator,
  PetitionApprovalsFilterOperator,
} from "@parallel/graphql/__types";
import { object } from "@parallel/utils/queryState";
import { useLogicalOperators } from "@parallel/utils/useLogicalOperators";
import { useCallback, useMemo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { useSearchUsers } from "../../../utils/useSearchUsers";
import { UserSelect } from "../../common/UserSelect";
import { Text } from "@parallel/components/ui";

export function PetitionListApprovalsFilter() {
  const { control, setValue, watch } = useFormContext<{
    filter: PetitionApprovalsFilterInput | undefined;
  }>();
  const logicalOperators = useLogicalOperators();

  const {
    fields: filters,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "filter.filters",
  });
  const handleAddFilter = () => {
    const value = watch();
    if (isNullish(value.filter?.operator)) {
      setValue("filter.operator", "AND");
    }
    append({ operator: "STATUS", value: null as any });
  };

  return (
    <Stack width="280px">
      {filters.length ? (
        <Grid templateColumns="32px 240px" alignItems="center" columnGap={2} rowGap={2}>
          {filters.map((f, index) => {
            return (
              <PetitionListApprovalsFilterLine
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

interface PetitionListApprovalsFilterLineProps {
  index: number;
  onRemove: () => void;
  rootPath?: string;
}

export function PetitionListApprovalsFilterLine({
  index,
  onRemove,
  rootPath = "filter",
}: PetitionListApprovalsFilterLineProps) {
  const path = `${rootPath}.filters.${index}` as const;
  const intl = useIntl();

  const { setValue, setFocus, control, watch } = useFormContext<{
    [key: string]: PetitionApprovalsFilterInput | undefined;
  }>();
  const operator = watch(`${path}.operator`);

  const searchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      const users = await searchUsers(search, {
        excludeIds: excludeUsers,
      });

      return users;
    },
    [searchUsers, operator],
  );

  const operators = useMemo<SimpleOption<PetitionApprovalsFilterOperator>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.petition-list-approvals-filter.status",
          defaultMessage: "status is",
        }),
        value: "STATUS",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-approvals-filter.assigned-to",
          defaultMessage: "assigned to",
        }),
        value: "ASSIGNED_TO",
      },
    ];
  }, [intl.locale]);

  const statusOptions = useMemo<SimpleOption<string>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.petition-list-approvals-filter.without-approval",
          defaultMessage: "Without approval",
        }),
        value: "WITHOUT_APPROVAL",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-approvals-filter.approval-not-started",
          defaultMessage: "Approval not started",
        }),
        value: "NOT_STARTED",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-approvals-filter.pending",
          defaultMessage: "Pending",
        }),
        value: "PENDING",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-approvals-filter.approved",
          defaultMessage: "Approved",
        }),
        value: "APPROVED",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-approvals-filter.rejected",
          defaultMessage: "Rejected",
        }),
        value: "REJECTED",
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

      {operator === "STATUS" ? (
        <Controller
          key="status"
          control={control}
          name={`${path}.value`}
          rules={{ required: true }}
          render={({ field, fieldState: { error } }) => (
            <FormControl gridColumn="2" isInvalid={isNonNullish(error)}>
              <SimpleSelect
                {...field}
                size="sm"
                options={statusOptions}
                placeholder={intl.formatMessage({
                  id: "component.petition-list-approvals-filter.select-a-status",
                  defaultMessage: "Select a status",
                })}
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
      ) : (
        <Controller
          key="assigned-to"
          control={control}
          name={`${path}.value`}
          rules={{ required: true }}
          render={({ field: { onChange, value, ...field }, fieldState: { error } }) => (
            <FormControl gridColumn="2" isInvalid={isNonNullish(error)}>
              <UserSelect
                size="sm"
                {...field}
                value={value}
                onChange={(user) => onChange(user?.id ?? (null as any))}
                onSearch={handleSearchUsers}
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
      )}
    </>
  );
}

export function approvalsQueryItem() {
  return object<PetitionApprovalsFilterInput>({
    flatten(data) {
      return [data.operator, ...data.filters.flatMap((f) => [f.operator, f.value])];
    },
    unflatten(data: string[]) {
      const value: PetitionApprovalsFilterInput = {
        operator: data[0] as PetitionApprovalsFilterLogicalOperator,
        filters: [],
      };
      let i = 1;
      while (i < data.length) {
        value.filters.push({
          operator: data[i] as PetitionApprovalsFilterOperator,
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
