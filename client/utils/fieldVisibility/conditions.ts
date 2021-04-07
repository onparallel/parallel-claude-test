import { PetitionField } from "@parallel/graphql/__types";
import { FieldOptions, getFirstDynamicSelectValue } from "../petitionFields";
import {
  PetitionFieldVisibilityCondition,
  PetitionFieldVisibilityConditionModifier,
  PseudoPetitionFieldVisibilityConditionOperator,
} from "./types";

/**
 * Build an initial condition based on the given field
 */
export function defaultCondition<
  T extends Pick<PetitionField, "id" | "type" | "options">
>(value: T | [T, number]): PetitionFieldVisibilityCondition {
  const [field, column] = Array.isArray(value) ? value : [value];
  const isOnlyHasReplies =
    field.type === "FILE_UPLOAD" ||
    (field.type === "DYNAMIC_SELECT" && column === undefined);
  return {
    fieldId: field.id,
    modifier: isOnlyHasReplies ? "NUMBER_OF_REPLIES" : "ANY",
    operator: isOnlyHasReplies ? "GREATER_THAN" : "EQUAL",
    value: defaultConditionFieldValue(field, column),
    column,
  };
}

function defaultConditionFieldValue<
  T extends Pick<PetitionField, "id" | "type" | "options">
>(field: T, column?: number): number | string | null {
  if (
    field.type === "FILE_UPLOAD" ||
    (field.type === "DYNAMIC_SELECT" && column === undefined)
  ) {
    return 0;
  } else if (field.type === "SELECT") {
    return (field.options as FieldOptions["SELECT"]).values[0];
  } else if (field.type === "DYNAMIC_SELECT" && column !== undefined) {
    return getFirstDynamicSelectValue(
      (field.options as FieldOptions["DYNAMIC_SELECT"]).values,
      column!
    );
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
  } else if (field.multiple && condition.modifier === "NUMBER_OF_REPLIES") {
    return { ...condition, operator };
  } else {
    return {
      ...condition,
      operator,
      // override existing "has replies/does not have replies"
      modifier:
        condition.modifier === "NUMBER_OF_REPLIES" ? "ANY" : condition.modifier,
      value:
        condition.modifier === "NUMBER_OF_REPLIES"
          ? defaultConditionFieldValue(field, condition.column)
          : condition.value,
    };
  }
}

export function updateConditionModifier<
  T extends Pick<PetitionField, "id" | "type" | "options" | "multiple">
>(
  condition: PetitionFieldVisibilityCondition,
  field: T,
  modifier: PetitionFieldVisibilityConditionModifier
): PetitionFieldVisibilityCondition {
  if (
    modifier === "NUMBER_OF_REPLIES" &&
    condition.modifier !== "NUMBER_OF_REPLIES"
  ) {
    return {
      ...condition,
      modifier,
      operator: "GREATER_THAN",
      value: 0,
    };
  } else if (
    modifier !== "NUMBER_OF_REPLIES" &&
    condition.modifier === "NUMBER_OF_REPLIES"
  ) {
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
