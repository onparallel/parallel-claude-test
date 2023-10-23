import { PetitionField } from "@parallel/graphql/__types";
import { format } from "date-fns";
import { isFileTypeField } from "../isFileTypeField";
import { FieldOptions, getFirstDynamicSelectValue } from "../petitionFields";
import { PetitionFieldLogicCondition } from "./types";

/**
 * Build an initial condition based on the given field
 */
export function defaultFieldCondition<T extends Pick<PetitionField, "id" | "type" | "options">>(
  value: T | [T, number],
): PetitionFieldLogicCondition {
  const [field, column] = Array.isArray(value) ? value : [value];
  const isOnlyHasReplies =
    isFileTypeField(field.type) ||
    (field.type === "DYNAMIC_SELECT" && column === undefined) ||
    field.type === "FIELD_GROUP";
  return {
    fieldId: field.id,
    modifier: isOnlyHasReplies ? "NUMBER_OF_REPLIES" : "ANY",
    operator: isOnlyHasReplies
      ? "GREATER_THAN"
      : field.type === "CHECKBOX"
      ? "CONTAIN"
      : field.type === "NUMBER"
      ? "GREATER_THAN"
      : field.type === "DATE" || field.type === "DATE_TIME"
      ? "LESS_THAN"
      : "EQUAL",
    value: defaultFieldConditionValue(field, column),
    column,
  };
}

export function defaultFieldConditionValue<
  T extends Pick<PetitionField, "id" | "type" | "options">,
>(field: T, column?: number): number | string | null {
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
        column!,
      ) ?? null
    );
  } else if (field.type === "NUMBER") {
    return 0;
  } else if (field.type === "DATE") {
    return format(new Date(), "yyyy-MM-dd");
  } else if (field.type === "DATE_TIME") {
    return format(new Date(), "yyyy-MM-dd HH:mm");
  } else {
    return null;
  }
}
