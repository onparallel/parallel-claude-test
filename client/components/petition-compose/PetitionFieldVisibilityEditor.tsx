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
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import { PetitionFieldVisibility_PetitionFieldFragment } from "@parallel/graphql/__types";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import {
  useInlineReactSelectProps,
  useReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { CustomSelectProps } from "@parallel/utils/react-select/types";
import { Fragment, SetStateAction, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { pick } from "remeda";
import {
  PetitionFieldVisibility,
  PetitionFieldVisibilityCondition,
  PetitionFieldVisibilityConditionModifier,
  PetitionFieldVisibilityConditionOperator,
  PetitionFieldVisibilityOperator,
  PetitionFieldVisibilityType,
} from "@parallel/utils/fieldVisibility/types";

interface ValueProps<T> {
  value: T | null;
  onChange: (value: T) => void;
}

export interface PetitionFieldVisibilityProps {
  fieldId: string;
  visibility: PetitionFieldVisibility;
  fields: PetitionFieldVisibility_PetitionFieldFragment[];
  showError: boolean;
  onVisibilityEdit: (visibility: PetitionFieldVisibility) => void;
}

export function PetitionFieldVisibilityEditor({
  fieldId,
  visibility,
  fields,
  showError,
  onVisibilityEdit,
}: PetitionFieldVisibilityProps) {
  const intl = useIntl();
  const _fields = useMemo(
    () =>
      fields
        .filter((f) => f)
        // if we don't rename this, react-select picks the options property
        // and thinks you want groups
        .map((field) =>
          pick(field, [
            "id",
            "type",
            "title",
            "multiple",
            "isReadOnly",
            "fieldOptions",
          ])
        ),
    [fields]
  );
  const indices = useFieldIndexValues(_fields);
  function setVisibility(
    dispatch: (prev: PetitionFieldVisibility) => PetitionFieldVisibility
  ) {
    onVisibilityEdit(dispatch(visibility));
  }
  function setConditions(
    value: SetStateAction<PetitionFieldVisibilityCondition[]>
  ) {
    return setVisibility((visibility) => ({
      ...visibility,
      conditions:
        typeof value === "function" ? value(visibility.conditions) : value,
    }));
  }
  function setVisibilityOperator(
    value: SetStateAction<PetitionFieldVisibilityOperator>
  ) {
    return setVisibility((visibility) => ({
      ...visibility,
      operator:
        typeof value === "function" ? value(visibility.operator) : value,
    }));
  }
  function setVisibilityType(
    value: SetStateAction<PetitionFieldVisibilityType>
  ) {
    return setVisibility((visibility) => ({
      ...visibility,
      type: typeof value === "function" ? value(visibility.type) : value,
    }));
  }
  const updateCondition = function (
    index: number,
    data: Partial<PetitionFieldVisibilityCondition>
  ) {
    setConditions((conditions) =>
      conditions.map((c, i) => (i === index ? { ...c, ...data } : c))
    );
  };
  const removeCondition = function (index: number) {
    setConditions((conditions) => conditions.filter((c, i) => i !== index));
  };
  const addCondition = function () {
    const index = fields.findIndex((f) => f.id === fieldId);
    // try to use previous reply, if not possible, use next
    const prev = fields
      .slice(0, index)
      .reverse()
      .find((f) => !f.isReadOnly);
    const ref = prev ?? fields.slice(index + 1).find((f) => f.id === fieldId)!;
    const condition: PetitionFieldVisibilityCondition = {
      fieldId: ref.id,
      modifier: ref.type === "FILE_UPLOAD" ? "NUMBER_OF_REPLIES" : "ANY",
      operator: "EQUAL",
      value:
        ref.type === "FILE_UPLOAD"
          ? 0
          : ref.type === "TEXT"
          ? null
          : ref.type === "SELECT"
          ? ref.fieldOptions.values[0] ?? null
          : null,
    };
    setConditions((conditions) => [...conditions, condition]);
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
            <Fragment key={index}>
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
                      onClick={() => removeCondition(index)}
                    />
                    {index === 1 ? (
                      <Box flex="1">
                        <VisibilityOperatorSelect
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
                size="sm"
                isInvalid={showError && !conditionField}
                value={conditionField}
                fields={_fields}
                indices={indices}
                onChange={(field) => {
                  const changedFieldType = field.type !== conditionField?.type;
                  updateCondition(index, {
                    fieldId: field?.id,
                    modifier:
                      field?.type === "FILE_UPLOAD"
                        ? "NUMBER_OF_REPLIES"
                        : !changedFieldType && field.multiple
                        ? condition.modifier
                        : "ANY",
                    operator: changedFieldType ? "EQUAL" : condition.operator,
                    value:
                      field.type === "SELECT"
                        ? field.fieldOptions.values[0] ?? null
                        : changedFieldType
                        ? null
                        : condition.value,
                  });
                }}
              />
              {conditionField ? (
                <Stack direction="row" gridColumn={{ base: "2", md: "auto" }}>
                  {conditionField.multiple ? (
                    <ConditionMultipleFieldModifier
                      type={conditionField.type}
                      value={condition.modifier}
                      onChange={(modifier) => {
                        const next = modifier === "NUMBER_OF_REPLIES";
                        const prev = condition.modifier === "NUMBER_OF_REPLIES";
                        const changedModifierType =
                          (next as any) + (prev as any) === 1;
                        updateCondition(index, {
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
                    showError={showError}
                    field={conditionField}
                    value={condition}
                    onChange={(condition) => updateCondition(index, condition)}
                  />
                </Stack>
              ) : (
                <Box />
              )}
            </Fragment>
          );
        })}
      </Grid>

      {visibility.conditions.length < 5 ? (
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
      ) : null}
    </Stack>
  );
}

PetitionFieldVisibilityEditor.fragments = {
  PetitionField: gql`
    fragment PetitionFieldVisibility_PetitionField on PetitionField {
      id
      type
      multiple
      fieldOptions: options
      isReadOnly
      ...PetitionFieldSelect_PetitionField
    }
    ${PetitionFieldSelect.fragments.PetitionField}
  `,
};

function ConditionMultipleFieldModifier({
  type,
  value,
  onChange,
}: CustomSelectProps<PetitionFieldVisibilityConditionModifier>) {
  const intl = useIntl();
  const options = useMemo<
    { label: string; value: PetitionFieldVisibilityConditionModifier }[]
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

interface ConditionPredicateProps
  extends ValueProps<PetitionFieldVisibilityCondition> {
  field: PetitionFieldVisibility_PetitionFieldFragment;
  showError: boolean;
}

function ConditionPredicate({
  field,
  value: condition,
  onChange,
  showError,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const { modifier } = condition!;
  const options = useMemo(() => {
    const options: {
      label: string;
      value:
        | PetitionFieldVisibilityConditionOperator
        | "HAVE_REPLY"
        | "NOT_HAVE_REPLY";
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
      | PetitionFieldVisibilityConditionOperator
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
    value:
      | PetitionFieldVisibilityConditionOperator
      | "HAVE_REPLY"
      | "NOT_HAVE_REPLY";
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
      <ConditionValue
        field={field}
        showError={showError}
        value={condition}
        onChange={onChange}
      />
    </>
  );
}

interface ConditionValueProps
  extends ValueProps<PetitionFieldVisibilityCondition> {
  field: PetitionFieldVisibility_PetitionFieldFragment;
  showError: boolean;
}

function ConditionValue({
  field,
  showError,
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
          isInvalid={showError && condition!.value === null}
          options={field.fieldOptions.values}
          value={condition!.value as any}
          onChange={(value) => onChange({ ...condition!, value })}
        />
      ) : (
        <Input
          size="sm"
          value={condition!.value ?? ""}
          backgroundColor="white"
          isInvalid={showError && condition!.value === null}
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

interface ConditionValueSelect extends CustomSelectProps<string> {
  options: string[];
}

function ConditionValueSelect({
  options,
  value,
  onChange,
  ...props
}: ConditionValueSelect) {
  const intl = useIntl();

  const rsProps = useReactSelectProps<any, false, never>({
    size: "sm",
    ...props,
  });
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
}: CustomSelectProps<PetitionFieldVisibilityOperator>) {
  const intl = useIntl();

  const rsProps = useReactSelectProps<any, false, never>({
    size: "sm",
    ...props,
  });
  const _options = useMemo<
    { label: string; value: PetitionFieldVisibilityOperator }[]
  >(
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
}: CustomSelectProps<PetitionFieldVisibilityType>) {
  const intl = useIntl();

  const rsProps = useInlineReactSelectProps<any, false, never>({
    size: "sm",
    ...props,
  });
  const _options = useMemo<
    { label: string; value: PetitionFieldVisibilityType }[]
  >(
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
