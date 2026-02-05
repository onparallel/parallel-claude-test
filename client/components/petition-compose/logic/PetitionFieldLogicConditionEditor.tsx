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
} from "@chakra-ui/react";
import { InfoCircleIcon } from "@parallel/chakra/icons";
import { BackgroundCheckTopicSelect } from "@parallel/components/common/BackgroundCheckTopicSelect";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import {
  toSimpleSelectOption,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import { ValueProps } from "@parallel/utils/ValueProps";
import { BACKGROUND_CHECK_TOPICS } from "@parallel/utils/backgroundCheckTopics";
import { FORMATS, dateToDatetimeLocal, prettifyTimezone } from "@parallel/utils/dates";
import { defaultFieldConditionValue } from "@parallel/utils/fieldLogic/conditions";
import {
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionMultipleValueModifier,
  PseudoPetitionFieldVisibilityConditionOperator,
} from "@parallel/utils/fieldLogic/types";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { isCompatibleListType } from "@parallel/utils/isCompatibleListType";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { never } from "@parallel/utils/never";
import { getDynamicSelectValues } from "@parallel/utils/petitionFields";
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
import { isNonNullish, isNullish, unique } from "remeda";
import { assert, noop } from "ts-essentials";
import { HelpPopover } from "../../common/HelpPopover";
import { NumeralInput } from "../../common/NumeralInput";
import { SimpleOption, SimpleSelect } from "../../common/SimpleSelect";
import { useCustomListDetailsDialog } from "../dialogs/CustomListDetailsDialog";
import { useStandardListDetailsDialog } from "../dialogs/StandardListDetailsDialog";
import { PetitionFieldLogicConditionSubjectSelect } from "./PetitionFieldLogicConditionSubjectSelect";
import { PetitionFieldSelection, usePetitionFieldLogicContext } from "./PetitionFieldLogicContext";
import { PetitionFieldMathEnumSelect } from "./PetitionFieldMathEnumSelect";
import { Text } from "@parallel/components/ui";

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
  const { fieldsWithIndices, fieldWithIndex, variables } = usePetitionFieldLogicContext();
  const field = fieldWithIndex?.[0];
  const referencedField =
    "fieldId" in condition
      ? fieldsWithIndices.find(([f]) => f.id === condition.fieldId)?.[0]
      : undefined;
  const isMultipleValue = isNonNullish(referencedField)
    ? referencedField.multiple ||
      (isNonNullish(referencedField.parent) &&
        referencedField.parent.id !== (field as any).parent?.id)
    : false;
  const Wrapper = isReadOnly ? Box : Fragment;

  const variable =
    "variableName" in condition
      ? variables.find((v) => v.name === condition.variableName)
      : undefined;
  return (
    <Wrapper {...(isReadOnly ? { fontSize: "sm" } : {})}>
      <PetitionFieldLogicConditionSubjectSelect
        value={condition}
        onChange={onConditionChange}
        isReadOnly={isReadOnly}
        showErrors={showErrors}
      />

      {isReadOnly ? (
        variable?.__typename === "PetitionVariableEnum" ? (
          <>
            <Text as="span">
              <FormattedMessage
                id="component.petition-field-logic-condition-editor.is-equal-to"
                defaultMessage="is equal to"
              />
            </Text>{" "}
            <PetitionFieldMathEnumSelect
              value={condition.value as string}
              onChange={noop}
              isReadOnly={true}
              variable={variable}
            />
          </>
        ) : (
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
        )
      ) : variable?.__typename === "PetitionVariableEnum" ? (
        <HStack>
          <SimpleSelect
            size="sm"
            options={[
              { label: "=", value: "EQUAL" },
              { label: "≠", value: "NOT_EQUAL" },
              { label: "<", value: "LESS_THAN" },
              { label: ">", value: "GREATER_THAN" },
              { label: "≤", value: "LESS_THAN_OR_EQUAL" },
              { label: "≥", value: "GREATER_THAN_OR_EQUAL" },
            ]}
            value={condition.operator}
            onChange={(operator) => {
              if (operator) {
                onConditionChange({ ...condition, operator });
              }
            }}
            styles={{
              menu: (styles) => ({
                ...styles,
                minWidth: "100%",
                width: "unset",
                insetInlineStart: "50%",
                transform: "translateX(-50%)",
              }),
              option: (styles) => ({
                ...styles,
                whiteSpace: "nowrap",
              }),
            }}
          />

          <Box flex="1">
            <PetitionFieldMathEnumSelect
              value={condition.value as string}
              onChange={(value) => {
                onConditionChange({ ...condition, value });
              }}
              variable={variable}
            />
          </Box>
        </HStack>
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
}: ValueProps<PetitionFieldLogicCondition, false> & { isReadOnly?: boolean }) {
  assert("fieldId" in condition);
  const { fieldsWithIndices } = usePetitionFieldLogicContext();
  const conditionField = fieldsWithIndices.find(([f]) => f.id === condition.fieldId)![0];
  const options = useSimpleSelectOptions<PetitionFieldLogicConditionMultipleValueModifier>(
    (intl) => {
      if (
        isFileTypeField(conditionField.type) ||
        (conditionField.type === "DYNAMIC_SELECT" && condition.column === undefined) ||
        conditionField.type === "FIELD_GROUP" ||
        conditionField.type === "ADVERSE_MEDIA_SEARCH"
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
      } else if (conditionField.type === "PROFILE_SEARCH") {
        return [
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.any",
              defaultMessage: "any",
            }),
            value: "ANY",
          },
          {
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.none",
              defaultMessage: "none",
            }),
            value: "NONE",
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
    <>{options.find((o) => o.value === condition.modifier)?.label} </>
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
            operator: conditionField.type === "BACKGROUND_CHECK" ? "HAS_BG_CHECK_RESULTS" : "EQUAL",
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
          insetInlineStart: "50%",
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
  referencedField?: PetitionFieldSelection;
}

function ConditionPredicate({
  value: condition,
  onChange,
  showErrors,
  isReadOnly,
}: ConditionPredicateProps) {
  const { fieldsWithIndices, fieldWithIndex, customLists, standardListDefinitions } =
    usePetitionFieldLogicContext();

  const field = fieldWithIndex?.[0];
  const isFieldCondition = "fieldId" in condition;
  const isVariableCondition = "variableName" in condition;
  const referencedField = isFieldCondition
    ? fieldsWithIndices.find(([f]) => f.id === condition.fieldId)?.[0]
    : undefined;
  const referencedVariable = isVariableCondition ? condition.variableName : undefined;
  const isMultipleValue = isNonNullish(referencedField)
    ? referencedField.multiple ||
      (isNonNullish(referencedField.parent) && referencedField.parent.id !== field?.parent?.id)
    : false;

  const filteredStandardListDefinitions = ["CHECKBOX", "SELECT"].includes(
    referencedField?.type ?? "",
  )
    ? standardListDefinitions.filter(({ listType }) =>
        isCompatibleListType(listType, referencedField?.options?.standardList),
      )
    : [];
  const options = useSimpleSelectOptions(
    (intl) => {
      const options: SimpleOption<PseudoPetitionFieldVisibilityConditionOperator>[] = [];
      if (isVariableCondition && isNonNullish(referencedVariable)) {
        options.push(
          { label: "=", value: "EQUAL" },
          { label: "≠", value: "NOT_EQUAL" },
          { label: "<", value: "LESS_THAN" },
          { label: ">", value: "GREATER_THAN" },
          { label: "≤", value: "LESS_THAN_OR_EQUAL" },
          { label: "≥", value: "GREATER_THAN_OR_EQUAL" },
        );
      } else if (isFieldCondition && isNonNullish(referencedField)) {
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
                id: "component.petition-field-visibility-editor.is-one-of-checkox",
                defaultMessage: "has one of",
              }),
              value: "IS_ONE_OF",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.not-is-one-of-checkox",
                defaultMessage: "doesn't have one of",
              }),
              value: "NOT_IS_ONE_OF",
            },
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
          if (isReadOnly || filteredStandardListDefinitions.length > 0) {
            options.push(
              {
                label: intl.formatMessage({
                  id: "component.petition-field-visibility-editor.all-is-in-list-select",
                  defaultMessage: "all are in list",
                }),
                value: "ALL_IS_IN_LIST",
              },
              {
                label: intl.formatMessage({
                  id: "component.petition-field-visibility-editor.any-is-in-list-select",
                  defaultMessage: "any is in list",
                }),
                value: "ANY_IS_IN_LIST",
              },
              {
                label: intl.formatMessage({
                  id: "component.petition-field-visibility-editor.none-is-in-list-select",
                  defaultMessage: "none is in list",
                }),
                value: "NONE_IS_IN_LIST",
              },
            );
          }
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
          if (isReadOnly || customLists.length > 0 || filteredStandardListDefinitions.length > 0) {
            options.push(
              {
                label: intl.formatMessage(
                  {
                    id: "component.petition-field-visibility-editor.is-in-list-select",
                    defaultMessage: "{modifier, select, ALL {are in list} other {is in list}}",
                  },
                  { modifier: condition.modifier },
                ),
                value: "IS_IN_LIST",
              },
              {
                label: intl.formatMessage(
                  {
                    id: "component.petition-field-visibility-editor.not-is-in-list-select",
                    defaultMessage:
                      "{modifier, select, ALL {are not in list} other {is not in list}}",
                  },
                  { modifier: condition.modifier },
                ),
                value: "NOT_IS_IN_LIST",
              },
            );
          }
        } else if (referencedField.type === "PROFILE_SEARCH") {
          options.push({
            label: intl.formatMessage({
              id: "component.petition-field-visibility-editor.has-profile-match",
              defaultMessage: "has a match",
            }),
            value: "HAS_PROFILE_MATCH",
          });
        } else if (referencedField.type === "BACKGROUND_CHECK") {
          options.push(
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.has-bg-check-results",
                defaultMessage: "has results available",
              }),
              value: "HAS_BG_CHECK_RESULTS",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.not-has-bg-check-results",
                defaultMessage: "does not have results available",
              }),
              value: "NOT_HAS_BG_CHECK_RESULTS",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.has-bg-check-match",
                defaultMessage: "has selected a profile",
              }),
              value: "HAS_BG_CHECK_MATCH",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.not-has-bg-check-match",
                defaultMessage: "has not selected a profile",
              }),
              value: "NOT_HAS_BG_CHECK_MATCH",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.has-pending-review",
                defaultMessage: "has pending review",
              }),
              value: "HAS_PENDING_REVIEW",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.not-has-pending-review",
                defaultMessage: "does not have pending review",
              }),
              value: "NOT_HAS_PENDING_REVIEW",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.has-bg-check-topics",
                defaultMessage: "has these topics",
              }),
              value: "HAS_BG_CHECK_TOPICS",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.not-has-bg-check-topics",
                defaultMessage: "does not have these topics",
              }),
              value: "NOT_HAS_BG_CHECK_TOPICS",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.has-any-bg-check-topics",
                defaultMessage: "has any topics",
              }),
              value: "HAS_ANY_BG_CHECK_TOPICS",
            },
            {
              label: intl.formatMessage({
                id: "component.petition-field-visibility-editor.not-has-any-bg-check-topics",
                defaultMessage: "does not have any topics",
              }),
              value: "NOT_HAS_ANY_BG_CHECK_TOPICS",
            },
          );
        } else if (
          isNonNullish(referencedField) &&
          !isFileTypeField(referencedField.type) &&
          referencedField.type !== "DYNAMIC_SELECT" &&
          referencedField.type !== "ADVERSE_MEDIA_SEARCH" &&
          referencedField.type !== "FIELD_GROUP" &&
          referencedField.type !== "USER_ASSIGNMENT"
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
    [referencedField, isMultipleValue, condition, referencedVariable, isReadOnly],
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
      isNonNullish(referencedField) &&
      ["SELECT", "DYNAMIC_SELECT", "CHECKBOX"].includes(referencedField.type) &&
      condition.modifier !== "NUMBER_OF_REPLIES"
    ) {
      assert("fieldId" in condition);
      const listOperators = [
        "IS_IN_LIST",
        "NOT_IS_IN_LIST",
        "ANY_IS_IN_LIST",
        "ALL_IS_IN_LIST",
        "NONE_IS_IN_LIST",
      ];

      const equalityOperators = ["EQUAL", "NOT_EQUAL"];
      const multiSelectOperators = ["IS_ONE_OF", "NOT_IS_ONE_OF"];
      const containOperators = ["CONTAIN", "NOT_CONTAIN"];

      // try to build a compatible value from the previous value depending on the new operator
      const value =
        listOperators.includes(condition.operator) && !listOperators.includes(operator)
          ? null
          : condition.value;

      const listName =
        listOperators.includes(condition.operator) && listOperators.includes(operator)
          ? value
          : (customLists?.[0]?.name ?? standardListDefinitions?.[0]?.listName ?? null);

      let nextValue = value;
      if (equalityOperators.includes(operator) && Array.isArray(value)) {
        nextValue = value?.[0] ?? defaultFieldConditionValue(referencedField, condition.column);
      } else if (
        referencedField.type === "CHECKBOX" &&
        containOperators.includes(operator) &&
        Array.isArray(value)
      ) {
        nextValue = value?.[0] ?? defaultFieldConditionValue(referencedField, condition.column);
      } else if (multiSelectOperators.includes(operator) && typeof value === "string") {
        nextValue = [value];
      } else if (listOperators.includes(operator)) {
        nextValue = listName;
      }

      onChange({
        ...condition,
        operator,
        value: nextValue,
      });
    } else if (
      isFieldCondition &&
      isNonNullish(referencedField) &&
      referencedField.type !== "BACKGROUND_CHECK" &&
      (condition.modifier === "NUMBER_OF_REPLIES" || condition.operator === "NUMBER_OF_SUBREPLIES")
    ) {
      // override existing "has replies/does not have replies"
      const defaultValue = defaultFieldConditionValue(referencedField, condition.column);
      const firstListName =
        customLists?.[0]?.name ?? standardListDefinitions?.[0]?.listName ?? null;
      onChange({
        ...condition,
        operator,
        modifier: "ANY",
        value: ["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(operator)
          ? isNonNullish(defaultValue) && typeof defaultValue === "string"
            ? [defaultValue]
            : null
          : [
                "IS_IN_LIST",
                "NOT_IS_IN_LIST",
                "ANY_IS_IN_LIST",
                "ALL_IS_IN_LIST",
                "NONE_IS_IN_LIST",
              ].includes(operator)
            ? firstListName
            : defaultValue,
      });
    } else if (referencedField?.type === "BACKGROUND_CHECK") {
      onChange({
        ...condition,
        modifier: "ANY",
        operator,
        value: ["HAS_BG_CHECK_TOPICS", "NOT_HAS_BG_CHECK_TOPICS"].includes(operator)
          ? Array.isArray(condition.value)
            ? condition.value
            : []
          : null,
      });
    } else {
      onChange({
        ...condition,
        operator,
      });
    }
  };

  return isFieldCondition &&
    ((!isMultipleValue && condition.modifier === "NUMBER_OF_REPLIES") ||
      referencedField?.type === "PROFILE_SEARCH" ||
      (referencedField?.type === "BACKGROUND_CHECK" &&
        condition.modifier !== "NUMBER_OF_REPLIES" &&
        !["HAS_BG_CHECK_TOPICS", "NOT_HAS_BG_CHECK_TOPICS"].includes(condition.operator))) ? (
    isReadOnly ? (
      <Box as="span">{options.find((o) => o.value === operator)?.label}</Box>
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
              insetInlineStart: "50%",
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
          <Box as="span">{options.find((o) => o.value === operator)?.label}</Box>{" "}
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
              insetInlineStart: "50%",
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
          isNullish(referencedField) ? (
          <ConditionPredicateValueNumber
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
          />
        ) : [
            "IS_IN_LIST",
            "NOT_IS_IN_LIST",
            "ALL_IS_IN_LIST",
            "ANY_IS_IN_LIST",
            "NONE_IS_IN_LIST",
          ].includes(condition.operator) ? (
          <ConditionPredicateListSelect
            value={condition}
            onChange={onChange}
            isReadOnly={isReadOnly}
            showErrors={showErrors}
            referencedField={referencedField}
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
        ) : referencedField.type === "BACKGROUND_CHECK" &&
          ["HAS_BG_CHECK_TOPICS", "NOT_HAS_BG_CHECK_TOPICS"].includes(condition.operator) ? (
          <ConditionPredicateBackgroundCheckTopicSelect
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

  useEffect(() => {
    if (condition.value !== value) {
      setValue(condition.value as string | null);
    }
  }, [condition.value]);

  return isReadOnly ? (
    isNonNullish(condition.value) ? (
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

  useEffect(() => {
    const conditionValue =
      condition.value && typeof condition.value === "string"
        ? dateToDatetimeLocal(condition.value)
        : null;

    if (conditionValue !== value) {
      setValue(conditionValue);
    }
  }, [condition.value]);

  const icon = (
    <HelpPopover marginStart={0}>
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
    isNonNullish(condition.value) ? (
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

  useEffect(() => {
    if ((!condition.value || condition.value === "0") && value) {
      setValue(condition.value as number);
    }
  }, [condition.value]);

  return isReadOnly ? (
    isNonNullish(condition.value) ? (
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
    isNonNullish(referencedField) && referencedField.type === "CHECKBOX"
      ? referencedField.options.values.length
      : Infinity;

  useEffect(() => {
    if ((!condition.value || condition.value === "0") && value) {
      setValue(condition.value as number);
    }
  }, [condition.value]);

  useEffect(() => {
    if (maxValue < value) {
      setValue(maxValue);
      onChange({ ...condition, value: maxValue });
    }
    if (isNullish(condition.value)) {
      onChange({ ...condition, value: 0 });
    }
  }, [maxValue]);

  return isReadOnly ? (
    isNonNullish(condition.value) ? (
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
        paddingEnd={8}
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
    if (["SELECT", "CHECKBOX"].includes(referencedField.type)) {
      const values = (referencedField.options as FieldOptions["SELECT"] | FieldOptions["CHECKBOX"])
        .values;

      return unique(values)
        .map((value, index) => {
          let label = (referencedField.options as FieldOptions["SELECT"] | FieldOptions["CHECKBOX"])
            .labels?.[index];
          label = `${value}${isNonNullish(label) ? `: ${label}` : ""}`;

          return { label, value } as SimpleOption<string>;
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    } else {
      const values = getDynamicSelectValues(
        (referencedField.options as FieldOptions["DYNAMIC_SELECT"]).values,
        condition.column!,
      );
      return unique(values)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => toSimpleSelectOption(value)!);
    }
  }, [referencedField.type, referencedField.options.values, condition.column]);

  const isMultiCondition =
    condition.operator === "IS_ONE_OF" || condition.operator === "NOT_IS_ONE_OF";

  if (!isReadOnly) {
    return (
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
        styles={{
          valueContainer: (styles) => ({ ...styles, gridTemplateColumns: "1fr" }),
          option: (styles) => ({
            ...styles,
            WebkitLineClamp: "3",
            padding: "5px 8px",
          }),
        }}
      />
    );
  } else {
    const conditionOptions = options.filter(({ value }) => {
      return unMaybeArray(condition.value as string | string[]).includes(value);
    });
    return isNonNullish(condition.value) && conditionOptions.length > 0 ? (
      <FormattedList
        value={conditionOptions.map(({ label }, index) => (
          <Box as="span" key={index} fontStyle="italic">
            {'"'}
            {label}
            {'"'}
          </Box>
        ))}
        type="disjunction"
      />
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    );
  }
}

function ConditionPredicateValueString({
  showErrors: showError,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const [value, setValue] = useState(condition.value as string | null);

  useEffect(() => {
    if (!condition.value && value) {
      setValue(condition.value as string | null);
    }
  }, [condition.value]);

  return isReadOnly ? (
    isNonNullish(condition.value) ? (
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

function ConditionPredicateListSelect({
  showErrors,
  value: condition,
  onChange,
  isReadOnly,
  referencedField,
}: ConditionPredicateProps) {
  const intl = useIntl();
  const { customLists, standardListDefinitions, isTemplate } = usePetitionFieldLogicContext();

  const options = useSimpleSelectOptions(() => {
    const customListsOptions = customLists.map(({ name }) => ({
      value: name,
      label: name,
    }));

    const standardListsOptions = standardListDefinitions
      .filter(
        ({ listType }) =>
          isReadOnly || isCompatibleListType(listType, referencedField?.options?.standardList),
      )
      .map(({ title, listName, listVersion, versionFormat }) => ({
        value: listName,
        label: isNonNullish(listVersion)
          ? `${localizableUserTextRender({ intl, value: title, default: "" })} (${intl.formatDate(listVersion, versionFormat)})`
          : localizableUserTextRender({ intl, value: title, default: "" }),
      }));

    return customListsOptions.concat(standardListsOptions);
  }, [customLists, standardListDefinitions]);

  const selectedStandardList = standardListDefinitions.find(
    ({ listName }) => condition.value === listName,
  );

  const selectedCustomList = customLists.find((list) => list.name === condition.value);

  const showCustomListDetailsDialog = useCustomListDetailsDialog();
  const showStandardListDetailsDialog = useStandardListDetailsDialog();
  const handleViewListDetails = async () => {
    try {
      if (isNonNullish(selectedStandardList)) {
        await showStandardListDetailsDialog({
          standardListId: selectedStandardList.id,
          isTemplate,
        });
      } else if (isNonNullish(selectedCustomList)) {
        await showCustomListDetailsDialog({ customList: selectedCustomList });
      }
    } catch {}
  };

  if (!isReadOnly) {
    return (
      <HStack>
        <Box flex="1">
          <SimpleSelect
            size="sm"
            options={options}
            onChange={(value) => onChange({ ...condition, value })}
            value={condition.value as string | null}
            isReadOnly={isReadOnly}
            isInvalid={showErrors && condition.value === null}
            styles={{ valueContainer: (styles) => ({ ...styles, gridTemplateColumns: "1fr" }) }}
            isSearchable={false}
            placeholder={intl.formatMessage({
              id: "generic.select-an-option",
              defaultMessage: "Select an option",
            })}
          />
        </Box>

        {isNonNullish(selectedStandardList) || isNonNullish(selectedCustomList) ? (
          <IconButtonWithTooltip
            size="xs"
            variant="ghost"
            icon={<InfoCircleIcon boxSize={4} />}
            onClick={handleViewListDetails}
            label={intl.formatMessage({
              id: "component.petition-field-logic-condition-editor.view-list-content",
              defaultMessage: "View list contents",
            })}
          />
        ) : null}
      </HStack>
    );
  } else {
    const conditionOption = options.find(({ value }) => value === condition.value);

    return isNonNullish(condition.value) ? (
      <Box as="span" fontStyle="italic">
        {'"'}
        {conditionOption?.label ?? condition.value}
        {'"'}
      </Box>
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    );
  }
}

function ConditionPredicateBackgroundCheckTopicSelect({
  showErrors,
  value: condition,
  onChange,
  isReadOnly,
}: ConditionPredicateProps) {
  const intl = useIntl();

  if (!isReadOnly) {
    return (
      <BackgroundCheckTopicSelect
        size="sm"
        isReadOnly={isReadOnly}
        isMulti
        isInvalid={showErrors && condition.value === null}
        value={condition.value as string[] | null}
        onChange={(value) => onChange({ ...condition, value: value })}
        placeholder={intl.formatMessage({
          id: "generic.select-an-option",
          defaultMessage: "Select an option",
        })}
        styles={{
          valueContainer: (styles) => ({ ...styles, gridTemplateColumns: "1fr" }),
          option: (styles) => ({
            ...styles,
            WebkitLineClamp: "3",
            padding: "5px 8px",
          }),
        }}
      />
    );
  } else {
    return isNonNullish(condition.value) &&
      Array.isArray(condition.value) &&
      condition.value.length > 0 ? (
      <FormattedList
        value={(condition.value as string[]).map((value, index) => (
          <Box as="span" key={index} fontStyle="italic">
            {'"'}
            {BACKGROUND_CHECK_TOPICS[value]}
            {'"'}
          </Box>
        ))}
        type="conjunction"
      />
    ) : (
      <Box as="span" textStyle="hint">
        <FormattedMessage id="generic.unset-value" defaultMessage="Unset value" />
      </Box>
    );
  }
}
