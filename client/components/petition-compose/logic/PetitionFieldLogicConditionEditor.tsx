import {
  Box,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  toSimpleSelectOption,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { ValueProps } from "@parallel/utils/ValueProps";
import { FORMATS, dateToDatetimeLocal, prettifyTimezone } from "@parallel/utils/dates";
import { defaultFieldConditionValue } from "@parallel/utils/fieldLogic/conditions";
import {
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionMultipleValueModifier,
  PseudoPetitionFieldVisibilityConditionOperator,
} from "@parallel/utils/fieldLogic/types";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { never } from "@parallel/utils/never";
import { FieldOptions, getDynamicSelectValues } from "@parallel/utils/petitionFields";
import { OptimizedMenuList } from "@parallel/utils/react-select/OptimizedMenuList";
import { unMaybeArray } from "@parallel/utils/types";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  FormattedDate,
  FormattedList,
  FormattedMessage,
  FormattedNumber,
  useIntl,
} from "react-intl";
import { createFilter } from "react-select";
import { isDefined, uniq } from "remeda";
import { assert } from "ts-essentials";
import { HelpPopover } from "../../common/HelpPopover";
import { NumeralInput } from "../../common/NumeralInput";
import { SimpleOption, SimpleSelect } from "../../common/SimpleSelect";
import { PetitionFieldLogicConditionSubjectSelect } from "./PetitionFieldLogicConditionSubjectSelect";
import { usePetitionFieldLogicContext } from "./PetitionFieldLogicContext";

export function PetitionFieldLogicConditionEditor({
  condition,
  onConditionChange,
  isReadOnly,
  showErrors,
}: {
  condition: PetitionFieldLogicCondition;
  onConditionChange: (value: PetitionFieldLogicCondition) => void;
  isReadOnly?: boolean;
  showErrors?: boolean;
}) {
  const {
    fieldsWithIndices,
    fieldWithIndex: [field],
  } = usePetitionFieldLogicContext();
  const referencedField =
    "fieldId" in condition
      ? fieldsWithIndices.find(([f]) => f.id === condition.fieldId)?.[0]
      : undefined;
  const isMultipleValue = isDefined(referencedField)
    ? referencedField.multiple ||
      (isDefined(referencedField.parent) && referencedField.parent.id !== field.parent?.id)
    : false;
  const Wrapper = isReadOnly ? Box : Fragment;
  return (
    <Wrapper {...(isReadOnly ? { fontSize: "sm" } : {})}>
      <PetitionFieldLogicConditionSubjectSelect
        value={condition}
        onChange={onConditionChange}
        isReadOnly={isReadOnly}
        showErrors={showErrors}
      />
      {isReadOnly ? (
        <>
          {isMultipleValue ? (
            <ConditionMultipleValueModifier
              value={condition}
              onChange={onConditionChange}
              isReadOnly
            />
          ) : null}
          <ConditionPredicate
            value={condition}
            onChange={onConditionChange}
            showErrors={showErrors}
            isReadOnly
          />
        </>
      ) : (
        <Stack direction="row" gridColumn={{ base: "2", xl: "auto" }} alignItems="start">
          {isMultipleValue ? (
            <ConditionMultipleValueModifier value={condition} onChange={onConditionChange} />
          ) : null}
          <ConditionPredicate
            value={condition}
            onChange={onConditionChange}
            showErrors={showErrors}
          />
        </Stack>
      )}
    </Wrapper>
  );
}

function ConditionMultipleValueModifier({
  value: condition,
  onChange,
  isReadOnly,
}: ValueProps<PetitionFieldLogicCondition, false> & {
  isReadOnly?: boolean;
}) {
  assert("fieldId" in condition);
  const { fieldsWithIndices } = usePetitionFieldLogicContext();
  const conditionField = fieldsWithIndices.find(([f]) => f.id === condition.fieldId)![0];
  const options = useSimpleSelectOptions<PetitionFieldLogicConditionMultipleValueModifier>(
    (intl) => {
      if (
        isFileTypeField(conditionField.type) ||
        (conditionField.type === "DYNAMIC_SELECT" && condition.column === undefined) ||
        conditionField.type === "FIELD_GROUP"
      ) {
        return [
          {
            label: isFileTypeField(conditionField.type)
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
        const options: SimpleOption<PetitionFieldLogicConditionMultipleValueModifier>[] = [
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
        if (conditionField.type !== "DYNAMIC_SELECT") {
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
    [conditionField.type, condition.column],
  );

  return isReadOnly ? (
    <>{options.find((o) => o.value === condition.modifier)!.label} </>
  ) : (
    <SimpleSelect
      size="sm"
      options={options}
      value={condition.modifier}
      onChange={(modifier) => {
        if (modifier === null) {
          never();
        }
        if (modifier === "NUMBER_OF_REPLIES" && condition.modifier !== "NUMBER_OF_REPLIES") {
          onChange({
            ...condition,
            modifier,
            operator: "GREATER_THAN",
            value: 0,
          });
        } else if (modifier !== "NUMBER_OF_REPLIES" && condition.modifier === "NUMBER_OF_REPLIES") {
          onChange({
            ...condition,
            modifier,
            operator: "EQUAL",
            value: defaultFieldConditionValue(conditionField, condition.column),
          });
        } else {
          onChange({
            ...condition,
            modifier,
          });
        }
      }}
      styles={{
        menu: (styles) => ({
          ...styles,
          minWidth: "100%",
          width: "unset",
          left: "50%",
          transform: "translateX(-50%)",
        }),
        option: (styles) => ({
          ...styles,
          whiteSpace: "nowrap",
        }),
      }}
    />
  );
}

interface ConditionPredicateProps extends ValueProps<PetitionFieldLogicCondition, false> {
  showErrors?: boolean;
  isReadOnly?: boolean;
}

function ConditionPredicate({
  value: condition,
  onChange,
  showErrors,
  isReadOnly,
}: ConditionPredicateProps) {
  const {
    fieldsWithIndices,
    fieldWithIndex: [field],
  } = usePetitionFieldLogicContext();
  const isFieldCondition = "fieldId" in condition;
  const isVariableCondition = "variableName" in condition;
  const referencedField = isFieldCondition
    ? fieldsWithIndices.find(([f]) => f.id === condition.fieldId)?.[0]
    : undefined;
  const referencedVariable = isVariableCondition ? condition.variableName : undefined;
  const isMultipleValue = isDefined(referencedField)
    ? referencedField.multiple ||
      (isDefined(referencedField.parent) && referencedField.parent.id !== field.parent?.id)
    : false;
  const options = useSimpleSelectOptions(
    (intl) => {
      const options: SimpleOption<PseudoPetitionFieldVisibilityConditionOperator>[] = [];
      if (isVariableCondition && isDefined(referencedVariable)) {
        options.push(
          { label: "=", value: "EQUAL" },
          { label: "≠", value: "NOT_EQUAL" },
          { label: "<", value: "LESS_THAN" },
          { label: ">", value: "GREATER_THAN" },
          { label: "≤", value: "LESS_THAN_OR_EQUAL" },
          { label: "≥", value: "GREATER_THAN_OR_EQUAL" },
        );
      } else if (isFieldCondition && isDefined(referencedField)) {
        if (
          (isMultipleValue && condition.modifier === "NUMBER_OF_REPLIES") ||
          referencedField.type === "NUMBER"
        ) {
          options.push(
            { label: "=", value: "EQUAL" },
            { label: "≠", value: "NOT_EQUAL" },
            { label: "<", value: "LESS_THAN" },
            { label: ">", value: "GREATER_THAN" },
            { label: "≤", value: "LESS_THAN_OR_EQUAL" },
            { label: "≥", value: "GREATER_THAN_OR_EQUAL" },
          );
        } else if (referencedField.type === "DATE" || referencedField.type === "DATE_TIME") {
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
            },
          );
        } else if (referencedField.type === "CHECKBOX") {
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
            },
          );
        } else if (
          referencedField.type === "SELECT" ||
          (referencedField.type === "DYNAMIC_SELECT" && "column" in condition)
        ) {
          options.push(
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.equal-select",
                  defaultMessage: "{modifier, select, ALL {are} other {is}}",
                },
                { modifier: condition.modifier },
              ),
              value: "EQUAL",
            },
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.not-equal-select",
                  defaultMessage: "{modifier, select, ALL {are not} other {is not}}",
                },
                { modifier: condition.modifier },
              ),
              value: "NOT_EQUAL",
            },
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.is-one-of-select",
                  defaultMessage: "{modifier, select, ALL {are one of} other {is one of}}",
                },
                { modifier: condition.modifier },
              ),
              value: "IS_ONE_OF",
            },
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.not-is-one-of-select",
                  defaultMessage: "{modifier, select, ALL {are not one of} other {is not one of}}",
                },
                { modifier: condition.modifier },
              ),
              value: "NOT_IS_ONE_OF",
            },
          );
        } else if (
          isDefined(referencedField) &&
          !isFileTypeField(referencedField.type) &&
          referencedField.type !== "DYNAMIC_SELECT"
        ) {
          options.push(
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.equal-default",
                  defaultMessage: "{modifier, select, ALL {are equal to} other {is equal to}}",
                },
                { modifier: condition.modifier },
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
                { modifier: condition.modifier },
              ),
              value: "NOT_EQUAL",
            },
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.start-with-default",
                  defaultMessage: "{modifier, select, ALL {start with} other {starts with}}",
                },
                { modifier: condition.modifier },
              ),
              value: "START_WITH",
            },
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.end-with-default",
                  defaultMessage: "{modifier, select, ALL {end with} other {ends with}}",
                },
                { modifier: condition.modifier },
              ),
              value: "END_WITH",
            },
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.contain-default",
                  defaultMessage: "{modifier, select, ALL {contain} other {contains}}",
                },
                { modifier: condition.modifier },
              ),
              value: "CONTAIN",
            },
            {
              label: intl.formatMessage(
                {
                  id: "component.petition-field-visibility-editor.not-contain-default",
                  defaultMessage:
                    "{modifier, select, ALL {do not contain} other {does not contain}}",
                },
                { modifier: condition.modifier },
              ),
              value: "NOT_CONTAIN",
            },
          );
        }
        if (!isMultipleValue) {
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
            },
          );
        }
      }
      return options;
    },
    [referencedField, isMultipleValue, condition, referencedVariable],
  );
  const operator =
    isFieldCondition && !isMultipleValue && condition.modifier === "NUMBER_OF_REPLIES"
      ? condition.operator === "GREATER_THAN"
        ? "HAVE_REPLY"
        : "NOT_HAVE_REPLY"
      : condition.operator;

  const handleOperatorChange = (
    operator: PseudoPetitionFieldVisibilityConditionOperator | null,
  ) => {
    if (operator === null) {
      never();
    }
    if (operator === "HAVE_REPLY") {
      onChange({
        ...condition,
        modifier: "NUMBER_OF_REPLIES",
        operator: "GREATER_THAN",
        value: 0,
      });
    } else if (operator === "NOT_HAVE_REPLY") {
      onChange({
        ...condition,
        modifier: "NUMBER_OF_REPLIES",
        operator: "EQUAL",
        value: 0,
      });
    } else if (operator === "NUMBER_OF_SUBREPLIES") {
      onChange({
        ...condition,
        modifier: "ANY",
        operator: "NUMBER_OF_SUBREPLIES",
        value: 0,
      });
    } else if (isFieldCondition && isMultipleValue && condition.modifier === "NUMBER_OF_REPLIES") {
      onChange({ ...condition, operator });
    } else if (
      isFieldCondition &&
      isDefined(referencedField) &&
      ["SELECT", "DYNAMIC_SELECT"].includes(referencedField.type) &&
      condition.modifier !== "NUMBER_OF_REPLIES"
    ) {
      assert("fieldId" in condition);
      onChange({
        ...condition,
        operator,
        value:
          ["EQUAL", "NOT_EQUAL"].includes(operator) && Array.isArray(condition.value)
            ? condition.value?.[0] ?? defaultFieldConditionValue(referencedField, condition.column)
            : ["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(operator) &&
                typeof condition.value === "string"
              ? [condition.value]
              : condition.value,
      });
    } else {
      if (
        isFieldCondition &&
        isDefined(referencedField) &&
        (condition.modifier === "NUMBER_OF_REPLIES" ||
          condition.operator === "NUMBER_OF_SUBREPLIES")
      ) {
        // override existing "has replies/does not have replies"
        const defaultValue = defaultFieldConditionValue(referencedField, condition.column);
        onChange({
          ...condition,
          operator,
          modifier: "ANY",
          value: ["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(operator)
            ? isDefined(defaultValue) && typeof defaultValue === "string"
              ? [defaultValue]
              : null
            : defaultValue,
        });
      } else {
        onChange({
          ...condition,
          operator,
        });
      }
    }
  };

  return isFieldCondition && !isMultipleValue && condition.modifier === "NUMBER_OF_REPLIES" ? (
    isReadOnly ? (
      <Box as="span">{options.find((o) => o.value === operator)!.label}</Box>
    ) : (
      <Box flex="1" minWidth="0">
        <SimpleSelect
          size="sm"
          isReadOnly={isReadOnly}
          options={options}
          value={operator}
          onChange={handleOperatorChange}
          styles={{
            menu: (styles) => ({
              ...styles,
              minWidth: "100%",
              width: "unset",
              left: "50%",
              transform: "translateX(-50%)",
            }),
            option: (styles) => ({
              ...styles,
              whiteSpace: "nowrap",
            }),
          }}
        />
      </Box>
    )
  ) : (
    <>
      {isReadOnly ? (
        <>
          <Box as="span">{options.find((o) => o.value === operator)!.label}</Box>{" "}
        </>
      ) : (
        <SimpleSelect
          size="sm"
          isReadOnly={isReadOnly}
          options={options}
          value={operator}
          onChange={handleOperatorChange}
          styles={{
            menu: (styles) => ({
              ...styles,
              minWidth: "100%",
              width: "unset",
              left: "50%",
              transform: "translateX(-50%)",
            }),
            option: (styles) => ({
              ...styles,
              whiteSpace: "nowrap",
            }),
          }}
        />
      )}
      <Box {...(isReadOnly ? { as: "span" } : { flex: "1", minWidth: 20 })}>
        {isVariableCondition ? (
          <ConditionPredicateValueFloat
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
          />
        ) : condition.modifier === "NUMBER_OF_REPLIES" ||
          condition.operator === "NUMBER_OF_SUBREPLIES" ||
          !isDefined(referencedField) ? (
          <ConditionPredicateValueNumber
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
          />
        ) : referencedField.type === "CHECKBOX" ||
          referencedField.type === "SELECT" ||
          (referencedField.type === "DYNAMIC_SELECT" && (condition as any).column !== undefined) ? (
          <ConditionPredicateValueSelect
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
          />
        ) : referencedField.type === "NUMBER" ? (
          <ConditionPredicateValueFloat
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
          />
        ) : referencedField.type === "DATE" ? (
          <ConditionPredicateValueDate
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
          />
        ) : referencedField.type === "DATE_TIME" ? (
          <ConditionPredicateValueDatetime
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
          />
        ) : (
          <ConditionPredicateValueString
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
          />
        )}
      </Box>
    </>
  );
}

function ConditionPredicateValueDate({
  showErrors: showError,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState(condition.value as string | null);
  return isReadOnly ? (
    isDefined(condition.value) ? (
      <FormattedDate value={condition.value as string} {...FORMATS.L} />
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    )
  ) : (
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
      opacity={isReadOnly ? "1 !important" : undefined}
    />
  );
}

function ConditionPredicateValueDatetime({
  showErrors: showError,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState(
    condition.value && typeof condition.value === "string"
      ? dateToDatetimeLocal(condition.value)
      : null,
  );
  const icon = (
    <HelpPopover marginLeft={0}>
      <Text fontSize="sm">
        <FormattedMessage
          id="component.petition-field-visibility-editor.date-time-help"
          defaultMessage="This date and time use your current timezone {timezone}."
          values={{
            timezone: prettifyTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
          }}
        />
      </Text>
    </HelpPopover>
  );
  return isReadOnly ? (
    isDefined(condition.value) ? (
      <>
        <FormattedDate value={condition.value as string} {...FORMATS["L+LT"]} />{" "}
        <Box as="span" position="relative" top="-1.5px">
          {icon}
        </Box>
      </>
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    )
  ) : (
    <HStack>
      <Input
        size="sm"
        type="datetime-local"
        onChange={(e) => setValue(e.target.value || null)}
        onBlur={() => onChange({ ...condition!, value: value && new Date(value).toISOString() })}
        value={value ?? ""}
        backgroundColor="white"
        isInvalid={showError && value === null}
        placeholder={intl.formatMessage({
          id: "generic.enter-a-value",
          defaultMessage: "Enter a value",
        })}
        isDisabled={isReadOnly}
        opacity={isReadOnly ? "1 !important" : undefined}
      />
      {icon}
    </HStack>
  );
}

function ConditionPredicateValueFloat({
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState((condition.value as number) ?? 0);

  return isReadOnly ? (
    isDefined(condition.value) ? (
      <FormattedNumber value={condition.value as number} />
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    )
  ) : (
    <NumeralInput
      size="sm"
      backgroundColor="white"
      value={value}
      isDisabled={isReadOnly}
      opacity={isReadOnly ? "1 !important" : undefined}
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
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const { fieldsWithIndices } = usePetitionFieldLogicContext();
  const isFieldCondition = "fieldId" in condition;
  const referencedField = isFieldCondition
    ? fieldsWithIndices.find(([f]) => f.id === condition.fieldId)?.[0]
    : undefined;
  const [value, setValue] = useState((condition.value as number) ?? 0);
  const maxValue =
    isDefined(referencedField) && referencedField.type === "CHECKBOX"
      ? referencedField.options.values.length
      : Infinity;
  useEffect(() => {
    if (maxValue < value) {
      setValue(maxValue);
      onChange({ ...condition, value: maxValue });
    }
    if (!isDefined(condition.value)) {
      onChange({ ...condition, value: 0 });
    }
  }, [maxValue]);
  return isReadOnly ? (
    isDefined(condition.value) ? (
      <FormattedNumber value={condition.value as number} maximumFractionDigits={0} />
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    )
  ) : (
    <NumberInput
      size="sm"
      min={0}
      max={maxValue}
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
        opacity={isReadOnly ? "1 !important" : undefined}
      />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  );
}

function ConditionPredicateValueSelect({
  showErrors,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  assert("fieldId" in condition);
  const { fieldsWithIndices } = usePetitionFieldLogicContext();
  const referencedField = fieldsWithIndices.find(([f]) => f.id === condition.fieldId)![0];
  const options = useMemo(() => {
    const values =
      referencedField.type === "SELECT"
        ? (referencedField.options as FieldOptions["SELECT"]).values
        : referencedField.type === "CHECKBOX"
          ? (referencedField.options as FieldOptions["CHECKBOX"]).values
          : getDynamicSelectValues(
              (referencedField.options as FieldOptions["DYNAMIC_SELECT"]).values,
              condition.column!,
            );
    return uniq(values)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => toSimpleSelectOption(value)!);
  }, [referencedField.type, referencedField.options.values, condition.column]);
  const isMultiCondition =
    condition.operator === "IS_ONE_OF" || condition.operator === "NOT_IS_ONE_OF";
  return isReadOnly ? (
    isDefined(condition.value) &&
    (Array.isArray(condition.value) ? condition.value.length > 0 : true) ? (
      <FormattedList
        value={unMaybeArray(condition.value as string | string[]).map((value, index) => (
          <Box as="span" key={index} fontStyle="italic">
            {'"'}
            {value}
            {'"'}
          </Box>
        ))}
        type="disjunction"
      />
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    )
  ) : (
    <SimpleSelect
      size="sm"
      options={options}
      isReadOnly={isReadOnly}
      isInvalid={showErrors && condition.value === null}
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
      components={options.length > 100 ? { MenuList: OptimizedMenuList as any } : {}}
      singleLineOptions={options.length > 100}
      styles={{ valueContainer: (styles) => ({ ...styles, gridTemplateColumns: "1fr" }) }}
    />
  );
}

function ConditionPredicateValueString({
  showErrors: showError,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState(condition.value as string | null);
  return isReadOnly ? (
    isDefined(condition.value) ? (
      <Box as="span" fontStyle="italic">
        {'"'}
        {Number.isNaN(Number(condition.value)) ? (
          condition.value
        ) : (
          <FormattedNumber value={condition.value as number} maximumFractionDigits={0} />
        )}
        {'"'}
      </Box>
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    )
  ) : (
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
      opacity={isReadOnly ? "1 !important" : undefined}
    />
  );
}
