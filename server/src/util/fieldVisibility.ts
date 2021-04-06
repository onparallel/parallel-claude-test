/**
 * Similar code is also on /client/utils/fieldVisibility.ts
 * Don't forget to update it as well!
 */

import { indexBy } from "remeda";

export interface PetitionFieldVisibility {
  type: "SHOW" | "HIDE";
  operator: "AND" | "OR";
  conditions: PetitionFieldVisibilityCondition[];
}
export interface PetitionFieldVisibilityCondition {
  /*
    When used on the GraphQL validator, the fieldId will be a string (coming from the client)
    When used to evaluate a field visibility, the field will be a number (coming from the database)
  */
  fieldId: number | string;
  column?: number;
  modifier: "ANY" | "ALL" | "NONE" | "NUMBER_OF_REPLIES";
  operator:
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
  value: string | number | null;
}

type VisibilityField = {
  id: number;
  visibility: PetitionFieldVisibility | null;
  replies: { content: { text: string } }[];
};

function evaluatePredicate<T extends string | number>(
  reply: T,
  operator: PetitionFieldVisibilityCondition["operator"],
  value: T | null
) {
  const a = typeof reply === "string" ? reply.toLowerCase() : reply;
  const b = typeof value === "string" ? value.toLowerCase() : value;
  if (a === null || b === null) return false;
  switch (operator) {
    case "LESS_THAN":
      return a < b;
    case "LESS_THAN_OR_EQUAL":
      return a <= b;
    case "GREATER_THAN":
      return a > b;
    case "GREATER_THAN_OR_EQUAL":
      return a >= b;
    case "EQUAL":
      return a === b;
    case "NOT_EQUAL":
      return a !== b;
    case "START_WITH":
      return a.toString().startsWith(b.toString());
    case "END_WITH":
      return a.toString().endsWith(b.toString());
    case "CONTAIN":
      return a.toString().includes(b.toString());
    case "NOT_CONTAIN":
      return !a.toString().includes(b.toString());
    default:
      return false;
  }
}

function conditionIsMet(
  condition: PetitionFieldVisibilityCondition,
  field: VisibilityField,
  isVisible: boolean
) {
  const replies = isVisible ? (field.replies as any[]) : [];
  const { operator, value, modifier } = condition;
  function evaluator(reply: any) {
    const _value =
      condition.column !== undefined
        ? reply.content.text[condition.column]
        : reply.content.text;
    return evaluatePredicate(_value, operator, value);
  }
  switch (modifier) {
    case "ANY":
      return replies.some(evaluator);
    case "ALL":
      return replies.every(evaluator);
    case "NONE":
      return !replies.some(evaluator);
    case "NUMBER_OF_REPLIES":
      return evaluatePredicate(replies.length, operator, value);
    default:
      return false;
  }
}

export function evaluateFieldVisibility<T extends VisibilityField>(
  fields: T[]
): boolean[] {
  const fieldsById = indexBy(fields, (f) => f.id);
  const visibilitiesById: { [fieldId: string]: boolean } = {};
  for (const field of fields) {
    if (field.visibility) {
      const v = field.visibility as PetitionFieldVisibility;
      const result =
        v.operator === "OR"
          ? v.conditions.some((c) =>
              conditionIsMet(
                c,
                fieldsById[c.fieldId],
                visibilitiesById[c.fieldId]
              )
            )
          : v.conditions.every((c) =>
              conditionIsMet(
                c,
                fieldsById[c.fieldId],
                visibilitiesById[c.fieldId]
              )
            );
      visibilitiesById[field.id] = v.type === "SHOW" ? result : !result;
    } else {
      visibilitiesById[field.id] = true;
    }
  }
  return fields.map((f) => visibilitiesById[f.id]);
}
