import { PetitionField } from "@parallel/graphql/__types";
import { format } from "date-fns";
import { isDefined } from "remeda";
import { isFileTypeField } from "../isFileTypeField";
import { FieldOptions, getFirstDynamicSelectValue } from "../petitionFields";
import {
  PetitionFieldVisibilityCondition,
  PetitionFieldVisibilityConditionModifier,
  PseudoPetitionFieldVisibilityConditionOperator,
} from "./types";

/**
 * Build an initial condition based on the given field
 */
export function defaultCondition<T extends Pick<PetitionField, "id" | "type" | "options">>(
  value: T | [T, number]
): PetitionFieldVisibilityCondition {
  const [field, column] = Array.isArray(value) ? value : [value];
  const isOnlyHasReplies =
    isFileTypeField(field.type) || (field.type === "DYNAMIC_SELECT" && column === undefined);
  return {
    fieldId: field.id,
    modifier: isOnlyHasReplies ? "NUMBER_OF_REPLIES" : "ANY",
    operator: isOnlyHasReplies
      ? "GREATER_THAN"
      : field.type === "CHECKBOX"
      ? "CONTAIN"
      : field.type === "NUMBER"
      ? "GREATER_THAN"
      : field.type === "DATE"
      ? "LESS_THAN"
      : "EQUAL",
    value: defaultConditionFieldValue(field, column),
    column,
  };
}

function defaultConditionFieldValue<T extends Pick<PetitionField, "id" | "type" | "options">>(
  field: T,
  column?: number
): number | string | null {
  if (isFileTypeField(field.type) || (field.type === "DYNAMIC_SELECT" && column === undefined)) {
    return 0;
  } else if (field.type === "SELECT") {
    return (field.options as FieldOptions["SELECT"]).values[0] ?? null;
  } else if (field.type === "CHECKBOX") {
    return (field.options as FieldOptions["CHECKBOX"]).values[0] ?? null;
  } else if (field.type === "DYNAMIC_SELECT" && column !== undefined) {
    return (
      getFirstDynamicSelectValue(
        (field.options as FieldOptions["DYNAMIC_SELECT"]).values,
        column!
      ) ?? null
    );
  } else if (field.type === "NUMBER") {
    return 0;
  } else if (field.type === "DATE") {
    return format(new Date(), "yyyy-MM-dd");
  } else {
    return null;
  }
}

export function updateConditionOperator<
  T extends Pick<PetitionField, "id" | "type" | "options" | "multiple">
>(
  condition: PetitionFieldVisibilityCondition,
  field: T,
  operator: PseudoPetitionFieldVisibilityConditionOperator
): PetitionFieldVisibilityCondition {
  if (operator === "HAVE_REPLY") {
    return {
      ...condition,
      modifier: "NUMBER_OF_REPLIES",
      operator: "GREATER_THAN",
      value: 0,
    };
  } else if (operator === "NOT_HAVE_REPLY") {
    return {
      ...condition,
      modifier: "NUMBER_OF_REPLIES",
      operator: "EQUAL",
      value: 0,
    };
  } else if (operator === "NUMBER_OF_SUBREPLIES") {
    return {
      ...condition,
      modifier: "ANY",
      operator: "NUMBER_OF_SUBREPLIES",
      value: 0,
    };
  } else if (field.multiple && condition.modifier === "NUMBER_OF_REPLIES") {
    return { ...condition, operator };
  } else if (
    ["SELECT", "DYNAMIC_SELECT"].includes(field.type) &&
    condition.modifier !== "NUMBER_OF_REPLIES"
  ) {
    return {
      ...condition,
      operator,
      value:
        ["EQUAL", "NOT_EQUAL"].includes(operator) && Array.isArray(condition.value)
          ? condition.value?.[0] ?? defaultConditionFieldValue(field, condition.column)
          : ["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(operator) && typeof condition.value === "string"
          ? [condition.value]
          : condition.value,
    };
  } else {
    if (
      condition.modifier === "NUMBER_OF_REPLIES" ||
      condition.operator === "NUMBER_OF_SUBREPLIES"
    ) {
      // override existing "has replies/does not have replies"
      const defaultValue = defaultConditionFieldValue(field, condition.column);
      return {
        ...condition,
        operator,
        modifier: "ANY",
        value: ["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(operator)
          ? isDefined(defaultValue) && typeof defaultValue === "string"
            ? [defaultValue]
            : null
          : defaultValue,
      };
    } else {
      const { value, modifier } = condition;
      return {
        ...condition,
        operator,
        modifier,
        value,
      };
    }
  }
}

export function updateConditionModifier<
  T extends Pick<PetitionField, "id" | "type" | "options" | "multiple">
>(
  condition: PetitionFieldVisibilityCondition,
  field: T,
  modifier: PetitionFieldVisibilityConditionModifier
): PetitionFieldVisibilityCondition {
  if (modifier === "NUMBER_OF_REPLIES" && condition.modifier !== "NUMBER_OF_REPLIES") {
    return {
      ...condition,
      modifier,
      operator: "GREATER_THAN",
      value: 0,
    };
  } else if (modifier !== "NUMBER_OF_REPLIES" && condition.modifier === "NUMBER_OF_REPLIES") {
    return {
      ...condition,
      modifier,
      operator: "EQUAL",
      value: defaultConditionFieldValue(field, condition.column),
    };
  } else {
    return {
      ...condition,
      modifier,
    };
  }
}
