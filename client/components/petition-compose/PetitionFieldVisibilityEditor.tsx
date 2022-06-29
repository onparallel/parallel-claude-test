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
import {
  toSimpleSelectOption,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { PetitionFieldVisibilityEditor_PetitionFieldFragment } from "@parallel/graphql/__types";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import {
  defaultCondition,
  updateConditionModifier,
  updateConditionOperator,
} from "@parallel/utils/fieldVisibility/conditions";
import {
  PetitionFieldVisibility,
  PetitionFieldVisibilityCondition,
  PetitionFieldVisibilityConditionModifier,
  PetitionFieldVisibilityOperator,
  PetitionFieldVisibilityType,
  PseudoPetitionFieldVisibilityConditionOperator,
} from "@parallel/utils/fieldVisibility/types";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { FieldOptions, getDynamicSelectValues } from "@parallel/utils/petitionFields";
import { OptimizedMenuList } from "@parallel/utils/react-select/OptimizedMenuList";
import { ValueProps } from "@parallel/utils/ValueProps";
import { Fragment, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { createFilter } from "react-select";
import { pick, uniq, zip } from "remeda";
import { NumeralInput } from "../common/NumeralInput";
import { SimpleOption, SimpleSelect, SimpleSelectProps } from "../common/SimpleSelect";

export interface PetitionFieldVisibilityProps {
  fieldId: string;
  visibility: PetitionFieldVisibility;
  fields: PetitionFieldVisibilityEditor_PetitionFieldFragment[];
  showError: boolean;
  onVisibilityEdit: (visibility: PetitionFieldVisibility) => void;
  isReadOnly?: boolean;
}

export function PetitionFieldVisibilityEditor({
  fieldId,
  visibility,
  fields,
  showError,
  onVisibilityEdit,
  isReadOnly,
}: PetitionFieldVisibilityProps) {
  const intl = useIntl();
  const indices = useFieldIndices(fields);
  const [_fields, _indices] = useMemo(() => {
    const index = fields.findIndex((f) => f.id === fieldId);
    const pairs = zip(fields, indices)
      .slice(0, index)
      .filter(([f]) => !f.isReadOnly)
      .map(
        ([field, index]) =>
          [
            pick(field, ["id", "type", "title", "multiple", "isReadOnly", "options"]),
            index,
          ] as const
      );
    const _fields: typeof pairs[0][0][] = [];
    const _indices: typeof pairs[0][1][] = [];
    for (const [field, index] of pairs) {
      _fields.push(field);
      _indices.push(index);
    }
    return [_fields, _indices];
  }, [fields, indices]);
  function setVisibility(dispatch: (prev: PetitionFieldVisibility) => PetitionFieldVisibility) {
    onVisibilityEdit(dispatch(visibility));
  }
  function setConditions(value: SetStateAction<PetitionFieldVisibilityCondition[]>) {
    return setVisibility((visibility) => ({
      ...visibility,
      conditions: typeof value === "function" ? value(visibility.conditions) : value,
    }));
  }
  function setVisibilityOperator(value: SetStateAction<PetitionFieldVisibilityOperator>) {
    return setVisibility((visibility) => ({
      ...visibility,
      operator: typeof value === "function" ? value(visibility.operator) : value,
    }));
  }
  function setVisibilityType(value: SetStateAction<PetitionFieldVisibilityType>) {
    return setVisibility((visibility) => ({
      ...visibility,
      type: typeof value === "function" ? value(visibility.type) : value,
    }));
  }
  const updateCondition = function (index: number, condition: PetitionFieldVisibilityCondition) {
    setConditions((conditions) => conditions.map((c, i) => (i === index ? condition : c)));
  };
  const removeCondition = function (index: number) {
    setConditions((conditions) => conditions.filter((c, i) => i !== index));
  };
  const addCondition = function () {
    setConditions((conditions) => {
      const last = conditions[conditions.length - 1];

      if (last.operator === "NUMBER_OF_SUBREPLIES" || last.modifier === "NUMBER_OF_REPLIES") {
        return [...conditions, { ...last }];
      }

      const field = fields.find((f) => f.id === last.fieldId)!;
      if (field.type === "SELECT" || field.type === "CHECKBOX") {
        // if the previous condition is of type SELECT or CHECKBOX try to get the next value
        const values = field.options.values as string[];
        const index = Math.min(values.indexOf(last.value as string) + 1, values.length - 1);

        return [
          ...conditions,
          {
            ...last,
            value: values[index],
          },
        ];
      } else {
        return [...conditions, { ...last }];
      }
    });
  };

  return (
    <Stack spacing={1}>
      <Grid
        padding={3}
        borderRadius="md"
        backgroundColor="gray.100"
        templateColumns={{
          base: "auto minmax(160px, 1fr)",
          xl: "auto minmax(160px, 2fr) 3fr",
        }}
        alignItems="center"
        columnGap={2}
        rowGap={2}
      >
        {visibility.conditions.map((condition, index) => {
          const conditionField = _fields.find((f) => f.id === condition.fieldId);
          return (
            <Fragment key={index}>
              <Box fontSize="sm">
                {index === 0 ? (
                  <VisibilityTypeSelect
                    value={visibility.type}
                    onChange={(type) => setVisibilityType(type!)}
                    isDisabled={isReadOnly}
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
                      isDisabled={isReadOnly}
                    />
                    {index === 1 ? (
                      <Box flex="1">
                        <VisibilityOperatorSelect
                          value={visibility.operator}
                          onChange={(operator) => setVisibilityOperator(operator!)}
                          isDisabled={isReadOnly}
                        />
                      </Box>
                    ) : (
                      <Flex
                        flex="1"
                        alignItems="center"
                        paddingLeft="11px"
                        textStyle={isReadOnly ? "muted" : undefined}
                      >
                        {visibility.operator === "AND" ? (
                          <FormattedMessage
                            id="component.petition-field-visibility-editor.and"
                            defaultMessage="and"
                          />
                        ) : (
                          <FormattedMessage
                            id="component.petition-field-visibility-editor.or"
                            defaultMessage="or"
                          />
                        )}
                      </Flex>
                    )}
                  </Stack>
                )}
              </Box>
              {conditionField ? (
                <>
                  <PetitionFieldSelect
                    size="sm"
                    value={
                      condition.column !== undefined && conditionField.type === "DYNAMIC_SELECT"
                        ? [conditionField, condition.column]
                        : conditionField
                    }
                    expandFields
                    fields={_fields}
                    indices={_indices}
                    onChange={(value) => updateCondition(index, defaultCondition(value!))}
                    isDisabled={isReadOnly}
                  />
                  <Stack direction="row" gridColumn={{ base: "2", xl: "auto" }}>
                    {conditionField.multiple ? (
                      <ConditionMultipleFieldModifier
                        field={conditionField}
                        value={condition}
                        onChange={(condition) => {
                          updateCondition(index, condition);
                        }}
                        isReadOnly={isReadOnly}
                      />
                    ) : null}
                    <ConditionPredicate
                      showError={showError}
                      field={conditionField}
                      value={condition}
                      onChange={(condition) => updateCondition(index, condition)}
                      isReadOnly={isReadOnly}
                    />
                  </Stack>
                </>
              ) : (
                <Box />
              )}
            </Fragment>
          );
        })}
      </Grid>

      {visibility.conditions.length < 5 && !isReadOnly ? (
        <Button
          variant="ghost"
          fontWeight="normal"
          size="xs"
          leftIcon={<PlusCircleIcon position="relative" top="-1px" />}
          alignSelf="start"
          onClick={addCondition}
        >
          <FormattedMessage
            id="component.petition-field-visibility-editor.add-condition"
            defaultMessage="Add condition"
          />
        </Button>
      ) : null}
    </Stack>
  );
}

PetitionFieldVisibilityEditor.fragments = {
  PetitionField: gql`
    fragment PetitionFieldVisibilityEditor_PetitionField on PetitionField {
      id
      type
      multiple
      options
      isReadOnly
      ...PetitionFieldSelect_PetitionField
    }
    ${PetitionFieldSelect.fragments.PetitionField}
  `,
};

function ConditionMultipleFieldModifier({
  value: condition,
  field,
  onChange,
  isReadOnly,
}: ValueProps<PetitionFieldVisibilityCondition, false> & {
  field: PetitionFieldVisibilityEditor_PetitionFieldFragment;
  isReadOnly?: boolean;
}) {
  const options = useSimpleSelectOptions<PetitionFieldVisibilityConditionModifier>(
    (intl) => {
      if (
        isFileTypeField(field.type) ||
        (field.type === "DYNAMIC_SELECT" && condition.column === undefined)
      ) {
        return [
          {
            label: isFileTypeField(field.type)
              ? intl.formatMessage({
                  id: "component.petition-field-visibility-editor.number-of-files",
                  defaultMessage: "no. of files",
                })
              : intl.formatMessage({
                  id: "component.petition-field-visibility-editor.number-of-replies",
                  defaultMessage: "no. of replies",
                }),
            value: "NUMBER_OF_REPLIES",
          },
        ];
      } else {
        const options: SimpleOption<PetitionFieldVisibilityConditionModifier>[] = [
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.any",
              defaultMessage: "any",
            }),
            value: "ANY",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.all",
              defaultMessage: "all",
            }),
            value: "ALL",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.none",
              defaultMessage: "none",
            }),
            value: "NONE",
          },
        ];
        if (field.type !== "DYNAMIC_SELECT") {
          // do not show "number of replies" option for dynamic select sub-columns
          options.push({
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.number-of-replies",
              defaultMessage: "no. of replies",
            }),
            value: "NUMBER_OF_REPLIES",
          });
        }
        return options;
      }
    },
    [field.type, condition.column]
  );
  const handleChange = useCallback(
    (value: PetitionFieldVisibilityConditionModifier | null) => {
      onChange(updateConditionModifier(condition, field, value!));
    },
    [onChange, condition, field]
  );

  return (
    <SimpleSelect
      size="sm"
      isDisabled={isReadOnly}
      options={options}
      value={condition.modifier}
      onChange={handleChange}
      styles={{
        menu: (styles) => ({
          ...styles,
          minWidth: "100%",
          width: "unset",
          left: "50%",
          transform: "translateX(-50%)",
        }),
      }}
    />
  );
}

interface ConditionPredicateProps extends ValueProps<PetitionFieldVisibilityCondition, false> {
  field: PetitionFieldVisibilityEditor_PetitionFieldFragment;
  showError: boolean;
  max?: number;
  isReadOnly?: boolean;
}

function ConditionPredicate({
  field,
  value: condition,
  onChange,
  showError,
  isReadOnly,
}: ConditionPredicateProps) {
  const options = useSimpleSelectOptions(
    (intl) => {
      const options: SimpleOption<PseudoPetitionFieldVisibilityConditionOperator>[] = [];
      if (
        (field.multiple && condition.modifier === "NUMBER_OF_REPLIES") ||
        field.type === "NUMBER"
      ) {
        options.push(
          { label: "=", value: "EQUAL" },
          { label: "≠", value: "NOT_EQUAL" },
          { label: "<", value: "LESS_THAN" },
          { label: ">", value: "GREATER_THAN" },
          { label: "≤", value: "LESS_THAN_OR_EQUAL" },
          { label: "≥", value: "GREATER_THAN_OR_EQUAL" }
        );
      } else if (field.type === "DATE") {
        options.push(
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.equal-date",
              defaultMessage: "is the",
            }),
            value: "EQUAL",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.not-equal-date",
              defaultMessage: "is not the",
            }),
            value: "NOT_EQUAL",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.less-than-date",
              defaultMessage: "is before the",
            }),
            value: "LESS_THAN",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.greater-than-date",
              defaultMessage: "is after the",
            }),
            value: "GREATER_THAN",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.less-or-equal-than-date",
              defaultMessage: "is before the (incl.)",
            }),
            value: "LESS_THAN_OR_EQUAL",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.greater-or-equal-than-date",
              defaultMessage: "is after the (incl.)",
            }),
            value: "GREATER_THAN_OR_EQUAL",
          }
        );
      } else if (field.type === "CHECKBOX") {
        options.push(
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.contain-choice",
              defaultMessage: "is selected",
            }),
            value: "CONTAIN",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.not-contain-choice",
              defaultMessage: "is not selected",
            }),
            value: "NOT_CONTAIN",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.number-of-choices",
              defaultMessage: "no. of selected",
            }),
            value: "NUMBER_OF_SUBREPLIES",
          }
        );
      } else if (
        field.type === "SELECT" ||
        (field.type === "DYNAMIC_SELECT" && condition.column !== undefined)
      ) {
        options.push(
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.equal-select",
                defaultMessage: "{modifier, select, ALL {are} other {is}}",
              },
              { modifier: condition.modifier }
            ),
            value: "EQUAL",
          },
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.not-equal-select",
                defaultMessage: "{modifier, select, ALL {are not} other {is not}}",
              },
              { modifier: condition.modifier }
            ),
            value: "NOT_EQUAL",
          },
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.is-one-of-select",
                defaultMessage: "{modifier, select, ALL {are one of} other {is one of}}",
              },
              { modifier: condition.modifier }
            ),
            value: "IS_ONE_OF",
          },
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.not-is-one-of-select",
                defaultMessage: "{modifier, select, ALL {are not one of} other {is not one of}}",
              },
              { modifier: condition.modifier }
            ),
            value: "NOT_IS_ONE_OF",
          }
        );
      } else if (!isFileTypeField(field.type) && field.type !== "DYNAMIC_SELECT") {
        options.push(
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.equal-default",
                defaultMessage: "{modifier, select, ALL {are equal to} other {is equal to}}",
              },
              { modifier: condition.modifier }
            ),
            value: "EQUAL",
          },
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.not-equal-default",
                defaultMessage:
                  "{modifier, select, ALL {are not equal to} other {is not equal to}}",
              },
              { modifier: condition.modifier }
            ),
            value: "NOT_EQUAL",
          },
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.start-with-default",
                defaultMessage: "{modifier, select, ALL {start with} other {starts with}}",
              },
              { modifier: condition.modifier }
            ),
            value: "START_WITH",
          },
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.end-with-default",
                defaultMessage: "{modifier, select, ALL {end with} other {ends with}}",
              },
              { modifier: condition.modifier }
            ),
            value: "END_WITH",
          },
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.contain-default",
                defaultMessage: "{modifier, select, ALL {contain} other {contains}}",
              },
              { modifier: condition.modifier }
            ),
            value: "CONTAIN",
          },
          {
            label: intl.formatMessage(
              {
                id: "component.petition-field-visibility-editor.not-contain-default",
                defaultMessage: "{modifier, select, ALL {do not contain} other {does not contain}}",
              },
              { modifier: condition.modifier }
            ),
            value: "NOT_CONTAIN",
          }
        );
      }
      if (!field.multiple) {
        options.push(
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.have-reply",
              defaultMessage: "has replies",
            }),
            value: "HAVE_REPLY",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.not-have-reply",
              defaultMessage: "does not have replies",
            }),
            value: "NOT_HAVE_REPLY",
          }
        );
      }
      return options;
    },
    [field.type, field.multiple, condition.modifier]
  );
  const operator =
    !field.multiple && condition.modifier === "NUMBER_OF_REPLIES"
      ? condition.operator === "GREATER_THAN"
        ? "HAVE_REPLY"
        : "NOT_HAVE_REPLY"
      : condition.operator;
  const handleChange = useCallback(
    function (operator: PseudoPetitionFieldVisibilityConditionOperator | null) {
      onChange(updateConditionOperator(condition, field, operator!));
    },
    [onChange, condition, field]
  );

  return !field.multiple && condition.modifier === "NUMBER_OF_REPLIES" ? (
    <Box flex="1">
      <SimpleSelect
        size="sm"
        isDisabled={isReadOnly}
        options={options}
        value={operator}
        onChange={handleChange}
      />
    </Box>
  ) : (
    <>
      <SimpleSelect
        size="sm"
        isDisabled={isReadOnly}
        options={options}
        value={operator}
        onChange={handleChange}
        styles={{
          menu: (styles) => ({
            ...styles,
            minWidth: "100%",
            width: "unset",
            left: "50%",
            transform: "translateX(-50%)",
          }),
        }}
      />
      <Box flex="1" minWidth={20}>
        {condition.modifier === "NUMBER_OF_REPLIES" ||
        condition.operator === "NUMBER_OF_SUBREPLIES" ? (
          <ConditionPredicateValueNumber
            field={field}
            showError={showError}
            value={condition}
            onChange={onChange}
            max={field.type === "CHECKBOX" ? field.options.values.length : Infinity}
            isReadOnly={isReadOnly}
          />
        ) : field.type === "CHECKBOX" ||
          field.type === "SELECT" ||
          (field.type === "DYNAMIC_SELECT" && condition.column !== undefined) ? (
          <ConditionPredicateValueSelect
            field={field}
            showError={showError}
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
          />
        ) : field.type === "NUMBER" ? (
          <ConditionPredicateValueFloat
            field={field}
            showError={showError}
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
          />
        ) : field.type === "DATE" ? (
          <ConditionPredicateValueDate
            field={field}
            showError={showError}
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
          />
        ) : (
          <ConditionPredicateValueString
            field={field}
            showError={showError}
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
          />
        )}
      </Box>
    </>
  );
}

function ConditionPredicateValueDate({
  showError,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState(condition.value as string | null);
  return (
    <Input
      size="sm"
      type="date"
      onChange={(e) => setValue(e.target.value || null)}
      onBlur={() => onChange({ ...condition!, value })}
      value={value ?? ""}
      backgroundColor="white"
      isInvalid={showError && value === null}
      placeholder={intl.formatMessage({
        id: "generic.enter-a-value",
        defaultMessage: "Enter a value",
      })}
      isDisabled={isReadOnly}
    />
  );
}

function ConditionPredicateValueFloat({
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState((condition.value as number) ?? 0);

  return (
    <NumeralInput
      size="sm"
      backgroundColor="white"
      value={value}
      isDisabled={isReadOnly}
      onChange={(value) => setValue(value ?? 0)}
      onBlur={() => onChange({ ...condition, value })}
      placeholder={intl.formatMessage({
        id: "generic.enter-a-value",
        defaultMessage: "Enter a value",
      })}
    />
  );
}

function ConditionPredicateValueNumber({
  value: condition,
  max = Infinity,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState((condition.value as number) ?? 0);
  useEffect(() => {
    if (max < value) {
      setValue(max);
      onChange({ ...condition, value: max });
    }
  }, [max]);
  return (
    <NumberInput
      size="sm"
      min={0}
      max={max}
      value={value}
      onChange={(_, value) => setValue(value)}
      onBlur={() => onChange({ ...condition, value })}
      keepWithinRange
      clampValueOnBlur
      isDisabled={isReadOnly}
    >
      <NumberInputField
        type="number"
        textAlign="right"
        paddingRight={8}
        backgroundColor="white"
        placeholder={intl.formatMessage({
          id: "generic.enter-a-value",
          defaultMessage: "Enter a value",
        })}
      />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  );
}

function ConditionPredicateValueSelect({
  field,
  showError,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const options = useMemo(() => {
    const values =
      field.type === "SELECT"
        ? (field.options as FieldOptions["SELECT"]).values
        : field.type === "CHECKBOX"
        ? (field.options as FieldOptions["CHECKBOX"]).values
        : getDynamicSelectValues(
            (field.options as FieldOptions["DYNAMIC_SELECT"]).values,
            condition.column!
          );
    return uniq(values)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => toSimpleSelectOption(value)!);
  }, [field.type, field.options.values, condition.column]);
  const isMultiCondition =
    condition.operator === "IS_ONE_OF" || condition.operator === "NOT_IS_ONE_OF";
  return (
    <SimpleSelect
      size="sm"
      options={options}
      isDisabled={isReadOnly}
      isInvalid={showError && condition.value === null}
      isMulti={isMultiCondition}
      value={condition.value as string | string[] | null}
      onChange={(value) => onChange({ ...condition, value: value })}
      filterOption={createFilter({
        // this improves search performance on long lists
        ignoreAccents: options.length > 1000 ? false : true,
      })}
      placeholder={intl.formatMessage({
        id: "generic.select-an-option",
        defaultMessage: "Select an option",
      })}
      components={{ MenuList: OptimizedMenuList as any }}
      styles={{ valueContainer: (styles) => ({ ...styles, gridTemplateColumns: "1fr" }) }}
    />
  );
}

function ConditionPredicateValueString({
  showError,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState(condition.value as string | null);
  return (
    <Input
      size="sm"
      onChange={(e) => setValue(e.target.value || null)}
      onBlur={() => onChange({ ...condition!, value })}
      value={value ?? ""}
      backgroundColor="white"
      isInvalid={showError && value === null}
      placeholder={intl.formatMessage({
        id: "generic.enter-a-value",
        defaultMessage: "Enter a value",
      })}
      isDisabled={isReadOnly}
    />
  );
}

function VisibilityOperatorSelect(
  props: Omit<SimpleSelectProps<PetitionFieldVisibilityOperator>, "options">
) {
  const options = useSimpleSelectOptions(
    (intl) => [
      {
        value: "AND",
        label: intl.formatMessage({
          id: "component.petition-field-visibility-editor.and",
          defaultMessage: "and",
        }),
      },
      {
        value: "OR",
        label: intl.formatMessage({
          id: "component.petition-field-visibility-editor.or",
          defaultMessage: "or",
        }),
      },
    ],
    []
  );
  return (
    <SimpleSelect
      size="sm"
      options={options}
      styles={{ control: (styles) => ({ ...styles, flexWrap: "nowrap" }) }}
      {...props}
    />
  );
}

function VisibilityTypeSelect(
  props: Omit<SimpleSelectProps<PetitionFieldVisibilityType>, "options">
) {
  const intl = useIntl();
  const options = useSimpleSelectOptions(
    () => [
      {
        value: "SHOW",
        label: intl.formatMessage({
          id: "component.petition-field-visibility-editor.show",
          defaultMessage: "Show when",
        }),
      },
      {
        value: "HIDE",
        label: intl.formatMessage({
          id: "component.petition-field-visibility-editor.hide",
          defaultMessage: "Hide when",
        }),
      },
    ],
    []
  );

  return (
    <SimpleSelect
      size="sm"
      options={options}
      styles={{ control: (styles) => ({ ...styles, flexWrap: "nowrap" }) }}
      {...props}
    />
  );
}
