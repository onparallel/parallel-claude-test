import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Grid,
  IconButton,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
} from "@chakra-ui/react";
import { DeleteIcon, PlusCircleIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import {
  PetitionFieldCondition_PetitionFieldFragment,
  PruebasQuery,
  PruebasQueryVariables,
  usePruebasQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import {
  useInlineReactSelectProps,
  useReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { UnwrapPromise } from "@parallel/utils/types";
import { Fragment, SetStateAction, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

function Pruebas({
  petitionId,
}: UnwrapPromise<ReturnType<typeof Pruebas.getInitialProps>>) {
  const {
    data: { petition },
  } = assertQuery(usePruebasQuery({ variables: { id: petitionId } }));
  console.log(petition);
  return (
    <Box padding={8}>
      <PetitionFieldCondition fields={petition!.fields} />
    </Box>
  );
}

Pruebas.fragments = {
  get Petition() {
    return gql`
      fragment Pruebas_Petition on PetitionBase {
        id
        fields {
          ...PetitionFieldCondition_PetitionField
        }
      }
      ${PetitionFieldCondition.fragments.PetitionField}
    `;
  },
};

Pruebas.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await fetchQuery<PruebasQuery, PruebasQueryVariables>(
    gql`
      query Pruebas($id: GID!) {
        petition(id: $id) {
          ...Pruebas_Petition
        }
      }
      ${Pruebas.fragments.Petition}
    `,
    {
      variables: {
        id: query.petitionId as string,
      },
      ignoreCache: true,
    }
  );

  return {
    petitionId: query.petitionId as string,
  };
};

export default compose(withDialogs, withApolloData)(Pruebas);

interface ValueProps<T> {
  value: T | null;
  onChange: (value: T) => void;
}

interface Visibility {
  type: VisibilityType;
  operator: VisibilityOperator;
  conditions: Condition[];
}

type VisibilityType = "SHOW" | "HIDE";

type VisibilityOperator = "AND" | "OR";

interface Condition {
  id: string;
  fieldId: string | null;
  modifier: ConditionMultipleFieldModifier;
  operator: ConditionOperator;
  value: string | number | null;
}

type ConditionValue = string | number | null;

type ConditionMultipleFieldModifier =
  | "ANY"
  | "ALL"
  | "NONE"
  | "NUMBER_OF_REPLIES";

type ConditionOperator =
  | "EQUAL"
  | "NOT_EQUAL"
  | "START_WITH"
  | "END_WITH"
  | "CONTAIN"
  | "NOT_CONTAIN"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL";

let counter = 0;

interface PetitionFieldConditionProps {
  fields: PetitionFieldCondition_PetitionFieldFragment[];
}

function PetitionFieldCondition({ fields }: PetitionFieldConditionProps) {
  const intl = useIntl();
  const _fields = useMemo(() => fields.filter((f) => f.type !== "HEADING"), [
    fields,
  ]);
  const indices = useFieldIndexValues(_fields);
  const [visibility, setVisibility] = useState<Visibility>({
    type: "SHOW",
    operator: "AND",
    conditions: [
      {
        id: `${counter++}`,
        fieldId: "6Y8DSH92uxPavbeseLeRq",
        modifier: "NUMBER_OF_REPLIES",
        operator: "EQUAL",
        value: null,
      },
      {
        id: `${counter++}`,
        fieldId: null,
        modifier: "ANY",
        operator: "EQUAL",
        value: null,
      },
    ],
  });
  function setConditions(value: SetStateAction<Condition[]>) {
    return setVisibility((visibility) => ({
      ...visibility,
      conditions:
        typeof value === "function" ? value(visibility.conditions) : value,
    }));
  }
  function setVisibilityOperator(value: SetStateAction<VisibilityOperator>) {
    return setVisibility((visibility) => ({
      ...visibility,
      operator:
        typeof value === "function" ? value(visibility.operator) : value,
    }));
  }
  function setVisibilityType(value: SetStateAction<VisibilityType>) {
    return setVisibility((visibility) => ({
      ...visibility,
      type: typeof value === "function" ? value(visibility.type) : value,
    }));
  }
  const updateCondition = function (
    conditionId: string,
    data: Partial<Condition>
  ) {
    setConditions((conditions) =>
      conditions.map((c) => (c.id === conditionId ? { ...c, ...data } : c))
    );
  };
  const removeCondition = function (conditionId: string) {
    setConditions((conditions) =>
      conditions.filter((c) => c.id !== conditionId)
    );
  };
  const addCondition = function () {
    setConditions((conditions) => [
      ...conditions,
      {
        id: `${counter++}`,
        fieldId: null,
        modifier: "ANY",
        operator: "EQUAL",
        value: null,
      },
    ]);
  };
  return (
    <Stack spacing={1}>
      <Grid
        paddingY={3}
        paddingX={4}
        borderRadius="md"
        backgroundColor="gray.100"
        templateColumns={{
          base: "auto minmax(160px, 1fr)",
          md: "auto minmax(160px, 2fr) 3fr",
        }}
        alignItems="center"
        columnGap={2}
        rowGap={2}
      >
        {visibility.conditions.map((condition, index) => {
          const conditionField = condition.fieldId
            ? _fields.find((f) => f.id === condition.fieldId) ?? null
            : null;
          return (
            <Fragment key={condition.id}>
              <Box fontSize="sm">
                {index === 0 ? (
                  <VisibilityTypeSelect
                    value={visibility.type}
                    onChange={setVisibilityType}
                  />
                ) : (
                  <Stack direction="row">
                    <IconButton
                      size="sm"
                      variant="outline"
                      icon={<DeleteIcon />}
                      aria-label={intl.formatMessage({
                        id: "generic.remove",
                        defaultMessage: "Remove",
                      })}
                      onClick={() => removeCondition(condition.id)}
                    />
                    {index === 1 ? (
                      <Box flex="1">
                        <VisibilityOperatorSelect
                          id={`petition-field-condition-and-or-select-${condition.id}`}
                          value={visibility.operator}
                          onChange={setVisibilityOperator}
                        />
                      </Box>
                    ) : (
                      <Flex flex="1" alignItems="center" paddingLeft="11px">
                        {visibility.operator === "AND" ? (
                          <FormattedMessage
                            id="component.petition-field-condition.and"
                            defaultMessage="and"
                          />
                        ) : (
                          <FormattedMessage
                            id="component.petition-field-condition.or"
                            defaultMessage="or"
                          />
                        )}
                      </Flex>
                    )}
                  </Stack>
                )}
              </Box>
              <PetitionFieldSelect
                id={`petition-field-condition-field-select-${condition.id}`}
                size="sm"
                value={conditionField}
                fields={_fields}
                indices={indices}
                onChange={(field) => {
                  const changedFieldType = field.type !== conditionField?.type;
                  updateCondition(condition.id, {
                    fieldId: field?.id,
                    modifier:
                      field?.type === "FILE_UPLOAD"
                        ? "NUMBER_OF_REPLIES"
                        : !changedFieldType && field.multiple
                        ? condition.modifier
                        : "ANY",
                    operator: changedFieldType ? "EQUAL" : condition.operator,
                    value: changedFieldType ? null : condition.value,
                  });
                }}
              />
              {conditionField ? (
                <Stack direction="row" gridColumn={{ base: "2", md: "auto" }}>
                  {conditionField.multiple ? (
                    <ConditionMultipleFieldModifier
                      id={`petition-field-condition-modifier-select-${condition.id}`}
                      type={conditionField.type}
                      value={condition.modifier}
                      onChange={(modifier) => {
                        const next = modifier === "NUMBER_OF_REPLIES";
                        const prev = condition.modifier === "NUMBER_OF_REPLIES";
                        const changedModifierType =
                          (next as any) + (prev as any) === 1;
                        updateCondition(condition.id, {
                          modifier,
                          operator: changedModifierType
                            ? "EQUAL"
                            : condition.operator,
                          value: changedModifierType ? null : condition.value,
                        });
                      }}
                    />
                  ) : null}
                  <ConditionPredicate
                    field={conditionField}
                    value={condition}
                    onChange={(condition) =>
                      updateCondition(condition.id, condition)
                    }
                  />
                </Stack>
              ) : (
                <Box />
              )}
            </Fragment>
          );
        })}
      </Grid>

      <Button
        variant="ghost"
        fontWeight="normal"
        size="xs"
        leftIcon={<PlusCircleIcon position="relative" top="-1px" />}
        alignSelf="start"
        onClick={addCondition}
      >
        Add condition
      </Button>
      <pre>{JSON.stringify(visibility, null, 2)}</pre>
    </Stack>
  );
}

PetitionFieldCondition.fragments = {
  PetitionField: gql`
    fragment PetitionFieldCondition_PetitionField on PetitionField {
      id
      type
      multiple
      # if we don't rename it there's issues with react-select thinking there's suboptions
      fieldOptions: options
      ...PetitionFieldSelect_PetitionField
    }
    ${PetitionFieldSelect.fragments.PetitionField}
  `,
};

function ConditionMultipleFieldModifier({
  type,
  value,
  onChange,
}: CustomSelectProps<ConditionMultipleFieldModifier>) {
  const intl = useIntl();
  const options = useMemo<
    { label: string; value: ConditionMultipleFieldModifier }[]
  >(() => {
    if (type === "FILE_UPLOAD") {
      return [
        {
          label: intl.formatMessage({
            id: "component.petition-field-condition.number-of-files",
            defaultMessage: "no. of files",
          }),
          value: "NUMBER_OF_REPLIES",
        },
      ];
    } else {
      return [
        {
          label: intl.formatMessage({
            id: "component.petition-field-condition.any",
            defaultMessage: "any",
          }),
          value: "ANY",
        },
        {
          label: intl.formatMessage({
            id: "component.petition-field-condition.all",
            defaultMessage: "all",
          }),
          value: "ALL",
        },
        {
          label: intl.formatMessage({
            id: "component.petition-field-condition.none",
            defaultMessage: "none",
          }),
          value: "NONE",
        },
        {
          label: intl.formatMessage({
            id: "component.petition-field-condition.number-of-replies",
            defaultMessage: "no. of replies",
          }),
          value: "NUMBER_OF_REPLIES",
        },
      ];
    }
  }, [type, intl.locale]);
  const _value = useMemo(() => options.find((o) => o.value === value), [
    options,
    value,
  ]);
  const rsProps = useInlineReactSelectProps<any, false, never>({
    size: "sm",
  });

  return (
    <Select
      options={options}
      value={_value}
      onChange={(value) => onChange(value.value)}
      {...rsProps}
    />
  );
}

interface ConditionPredicateProps extends ValueProps<Condition> {
  field: PetitionFieldCondition_PetitionFieldFragment;
}

function ConditionPredicate({
  field,
  value: condition,
  onChange,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const { modifier } = condition!;
  const options = useMemo(() => {
    const options: {
      label: string;
      value: ConditionOperator | "HAVE_REPLY" | "NOT_HAVE_REPLY";
    }[] = [];
    if (field.multiple && modifier === "NUMBER_OF_REPLIES") {
      options.push(
        { label: "=", value: "EQUAL" },
        { label: "≠", value: "NOT_EQUAL" },
        { label: "<", value: "LESS_THAN" },
        { label: ">", value: "GREATER_THAN" },
        { label: "≤", value: "LESS_THAN_OR_EQUAL" },
        { label: "≥", value: "GREATER_THAN_OR_EQUAL" }
      );
    } else if (field.type === "SELECT") {
      options.push(
        {
          label: intl.formatMessage(
            {
              id: "component.petition-field-condition.equal-select",
              defaultMessage: "{modifier, select, ALL {are} other {is}}",
            },
            { modifier }
          ),
          value: "EQUAL",
        },
        {
          label: intl.formatMessage(
            {
              id: "component.petition-field-condition.not-equal-select",
              defaultMessage:
                "{modifier, select, ALL {are not} other {is not}}",
            },
            { modifier }
          ),
          value: "NOT_EQUAL",
        }
      );
    } else {
      options.push(
        {
          label: intl.formatMessage(
            {
              id: "component.petition-field-condition.equal-default",
              defaultMessage:
                "{modifier, select, ALL {are equal to} other {is equal to}}",
            },
            { modifier }
          ),
          value: "EQUAL",
        },
        {
          label: intl.formatMessage(
            {
              id: "component.petition-field-condition.not-equal-default",
              defaultMessage:
                "{modifier, select, ALL {are not equal to} other {is not equal to}}",
            },
            { modifier }
          ),
          value: "NOT_EQUAL",
        },
        {
          label: intl.formatMessage(
            {
              id: "component.petition-field-condition.start-with-default",
              defaultMessage:
                "{modifier, select, ALL {start with} other {starts with}}",
            },
            { modifier }
          ),
          value: "START_WITH",
        },
        {
          label: intl.formatMessage(
            {
              id: "component.petition-field-condition.end-with-default",
              defaultMessage:
                "{modifier, select, ALL {end with} other {ends with}}",
            },
            { modifier }
          ),
          value: "END_WITH",
        },
        {
          label: intl.formatMessage(
            {
              id: "component.petition-field-condition.contain-default",
              defaultMessage:
                "{modifier, select, ALL {contain} other {contains}}",
            },
            { modifier }
          ),
          value: "CONTAIN",
        },
        {
          label: intl.formatMessage(
            {
              id: "component.petition-field-condition.not-contain-default",
              defaultMessage:
                "{modifier, select, ALL {do not contain} other {does not contain}}",
            },
            { modifier }
          ),
          value: "NOT_CONTAIN",
        }
      );
    }
    if (!field.multiple) {
      options.push(
        {
          label: intl.formatMessage({
            id: "component.petition-field-condition.has-reply",
            defaultMessage: "has replies",
          }),
          value: "HAVE_REPLY",
        },
        {
          label: intl.formatMessage({
            id: "component.petition-field-condition.has-reply",
            defaultMessage: "does not have replies",
          }),
          value: "NOT_HAVE_REPLY",
        }
      );
    }
    return options;
  }, [field.type, field.multiple, intl.locale, modifier]);

  const operator = useMemo(() => {
    let operator:
      | ConditionOperator
      | "HAVE_REPLY"
      | "NOT_HAVE_REPLY" = condition!.operator;
    if (!field.multiple && condition!.modifier === "NUMBER_OF_REPLIES") {
      operator =
        condition!.operator === "GREATER_THAN"
          ? "HAVE_REPLY"
          : "NOT_HAVE_REPLY";
    }
    return options.find((o) => o.value === operator);
  }, [options, condition!.operator, condition!.modifier, field.multiple]);
  const iprops = useInlineReactSelectProps<any, false, never>({ size: "sm" });
  const props = useReactSelectProps<any, false, never>({ size: "sm" });
  function handleChange({
    value,
  }: {
    value: ConditionOperator | "HAVE_REPLY" | "NOT_HAVE_REPLY";
  }) {
    if (value === "HAVE_REPLY") {
      onChange({
        ...condition!,
        modifier: "NUMBER_OF_REPLIES",
        operator: "GREATER_THAN",
        value: 0,
      });
    } else if (value === "NOT_HAVE_REPLY") {
      onChange({
        ...condition!,
        modifier: "NUMBER_OF_REPLIES",
        operator: "EQUAL",
        value: 0,
      });
    } else {
      if (field.multiple) {
        onChange({ ...condition!, operator: value });
      } else {
        onChange({
          ...condition!,
          modifier: "ANY",
          operator: value,
          value:
            condition!.modifier === "NUMBER_OF_REPLIES"
              ? null
              : condition!.value,
        });
      }
    }
  }
  return !field.multiple && condition!.modifier === "NUMBER_OF_REPLIES" ? (
    <Box flex="1">
      <Select
        options={options}
        value={operator}
        onChange={handleChange}
        {...props}
      />
    </Box>
  ) : (
    <>
      <Select
        options={options}
        value={operator}
        onChange={handleChange}
        {...iprops}
      />
      <ConditionValue field={field} value={condition} onChange={onChange} />
    </>
  );
}

interface ConditionValueProps extends ValueProps<Condition> {
  field: PetitionFieldCondition_PetitionFieldFragment;
}

function ConditionValue({
  field,
  value: condition,
  onChange,
}: ConditionValueProps) {
  const intl = useIntl();

  return (
    <Box flex="1" minWidth={20}>
      {condition!.modifier === "NUMBER_OF_REPLIES" ? (
        <NumberInput
          size="sm"
          min={0}
          value={condition!.value ?? 0}
          onChange={(_, value) => onChange({ ...condition!, value })}
          keepWithinRange
          clampValueOnBlur
          placeholder={intl.formatMessage({
            id: "generic.enter-a-value",
            defaultMessage: "Enter a value",
          })}
        >
          <NumberInputField
            type="number"
            textAlign="right"
            paddingRight={8}
            backgroundColor="white"
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      ) : field.type === "SELECT" ? (
        <ConditionValueSelect
          options={field.fieldOptions.values}
          value={condition!.value as any}
          onChange={(value) => onChange({ ...condition!, value })}
        />
      ) : (
        <Input
          size="sm"
          value={condition!.value ?? ""}
          backgroundColor="white"
          onChange={(e) =>
            onChange({ ...condition!, value: e.target.value || null })
          }
          placeholder={intl.formatMessage({
            id: "generic.enter-a-value",
            defaultMessage: "Enter a value",
          })}
        />
      )}
    </Box>
  );
}

interface ConditionValueSelect {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

function ConditionValueSelect({
  options,
  value,
  onChange,
}: ConditionValueSelect) {
  const intl = useIntl();

  const rsProps = useReactSelectProps<any, false, never>({ size: "sm" });
  const _options = useMemo(() => options.map(toSelectOption), [options]);
  const _value = toSelectOption(value);

  return (
    <Select
      options={_options}
      value={_value}
      onChange={(value) => onChange(value.value)}
      placeholder={intl.formatMessage({
        id: "generic.select-an-option",
        defaultMessage: "Select an option",
      })}
      {...rsProps}
    />
  );
}

function toSelectOption(value: string | null) {
  return value === null ? null : { value, label: value };
}

function VisibilityOperatorSelect({
  value,
  onChange,
  ...props
}: CustomSelectProps<VisibilityOperator>) {
  const intl = useIntl();

  const rsProps = useReactSelectProps<any, false, never>({
    size: "sm",
    ...props,
  });
  const _options = useMemo<{ label: string; value: VisibilityOperator }[]>(
    () => [
      {
        value: "AND",
        label: intl.formatMessage({
          id: "component.petition-field-condition.and",
          defaultMessage: "and",
        }),
      },
      {
        value: "OR",
        label: intl.formatMessage({
          id: "component.petition-field-condition.or",
          defaultMessage: "or",
        }),
      },
    ],
    [intl.locale]
  );
  const _value = useMemo(() => _options.find((o) => o.value === value), [
    value,
    _options,
  ]);

  return (
    <Select
      options={_options}
      value={_value}
      onChange={(value) => onChange(value.value)}
      {...rsProps}
    />
  );
}

function VisibilityTypeSelect({
  value,
  onChange,
  ...props
}: CustomSelectProps<VisibilityType>) {
  const intl = useIntl();

  const rsProps = useInlineReactSelectProps<any, false, never>({
    size: "sm",
    ...props,
  });
  const _options = useMemo<{ label: string; value: VisibilityType }[]>(
    () => [
      {
        value: "SHOW",
        label: intl.formatMessage({
          id: "component.petition-field-condition.show",
          defaultMessage: "Show when",
        }),
      },
      {
        value: "HIDE",
        label: intl.formatMessage({
          id: "component.petition-field-condition.hide",
          defaultMessage: "Hide when",
        }),
      },
    ],
    [intl.locale]
  );
  const _value = useMemo(() => _options.find((o) => o.value === value), [
    value,
    _options,
  ]);

  return (
    <Select
      options={_options}
      value={_value}
      onChange={(value) => onChange(value.value)}
      {...rsProps}
    />
  );
}
