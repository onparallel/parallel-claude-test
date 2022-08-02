/**
 * Similar code is also on /client/utils/fieldVisibility.ts
 * Don't forget to update it as well!
 */

import { indexBy } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldType } from "../db/__types";
import { completedFieldReplies } from "./completedFieldReplies";

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
    | "IS_ONE_OF"
    | "NOT_IS_ONE_OF"
    | "LESS_THAN"
    | "LESS_THAN_OR_EQUAL"
    | "GREATER_THAN"
    | "GREATER_THAN_OR_EQUAL"
    | "NUMBER_OF_SUBREPLIES";
  value: string | string[] | number | null;
}

type VisibilityField = {
  id: number | string;
  type: PetitionFieldType;
  options: any;
  visibility: PetitionFieldVisibility | null;
  replies: { content: any; anonymized_at: Date | null }[];
};

function evaluatePredicate(
  reply: string | number | string[],
  operator: PetitionFieldVisibilityCondition["operator"],
  value: string | string[] | number | null
) {
  try {
    if (reply === undefined || value === undefined || value === null) {
      return false;
    }

    // CHECKBOX
    if (Array.isArray(reply)) {
      switch (operator) {
        case "CONTAIN":
          assert(typeof value === "string");
          return reply.includes(value);
        case "NOT_CONTAIN":
          assert(typeof value === "string");
          return !reply.includes(value);
        case "NUMBER_OF_SUBREPLIES":
          assert(typeof value === "number");
          return reply.length === value;
        default:
          return false;
      }
    }

    // make matching case-insensitive
    const _reply = typeof reply === "string" ? reply.toLowerCase() : reply;
    const _value =
      typeof value === "string"
        ? value.toLowerCase()
        : Array.isArray(value)
        ? value.map((v) => v.toLowerCase())
        : value;

    if (_reply === null || _value === null) return false;
    switch (operator) {
      case "LESS_THAN":
        return _reply < _value;
      case "LESS_THAN_OR_EQUAL":
        return _reply <= _value;
      case "GREATER_THAN":
        return _reply > _value;
      case "GREATER_THAN_OR_EQUAL":
        return _reply >= _value;
      case "EQUAL":
        return _reply === _value;
      case "NOT_EQUAL":
        return _reply !== _value;
      case "START_WITH":
        assert(typeof _reply === "string");
        assert(typeof _value === "string");
        return _reply.startsWith(_value);
      case "END_WITH":
        assert(typeof _reply === "string");
        assert(typeof _value === "string");
        return _reply.endsWith(_value);
      case "CONTAIN":
        assert(typeof _reply === "string");
        assert(typeof _value === "string");
        return _reply.includes(_value);
      case "NOT_CONTAIN":
        assert(typeof _reply === "string");
        assert(typeof _value === "string");
        return !_reply.includes(_value);
      case "IS_ONE_OF":
        assert(typeof _reply === "string");
        assert(Array.isArray(_value));
        return _value.includes(_reply);
      case "NOT_IS_ONE_OF":
        assert(typeof _reply === "string");
        assert(Array.isArray(_value));
        return !_value.includes(_reply);
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
}

function conditionIsMet(
  condition: PetitionFieldVisibilityCondition,
  field: VisibilityField,
  isVisible: boolean
) {
  const replies = isVisible ? field.replies : [];
  const { operator, value, modifier } = condition;
  function evaluator(reply: VisibilityField["replies"][0]) {
    const _value =
      condition.column !== undefined
        ? reply.content.value?.[condition.column]?.[1] ?? null
        : reply.content.value;
    return evaluatePredicate(_value, operator, value);
  }

  const { type, options } = field;
  switch (modifier) {
    case "ANY":
      return replies.some(evaluator);
    case "ALL":
      return replies.every(evaluator);
    case "NONE":
      return !replies.some(evaluator);
    case "NUMBER_OF_REPLIES":
      const completed = completedFieldReplies({
        type,
        options,
        replies,
      });

      return evaluatePredicate(completed.length, operator, value);
    default:
      return false;
  }
}

export function evaluateFieldVisibility(fields: VisibilityField[]): boolean[] {
  const fieldsById = indexBy(fields, (f) => f.id);
  const visibilitiesById: { [fieldId: string]: boolean } = {};
  for (const field of fields) {
    if (field.visibility) {
      const { conditions, operator, type } = field.visibility as PetitionFieldVisibility;
      const result = conditions[operator === "OR" ? "some" : "every"]((c) =>
        conditionIsMet(c, fieldsById[c.fieldId], visibilitiesById[c.fieldId])
      );
      visibilitiesById[field.id] = type === "SHOW" ? result : !result;
    } else {
      visibilitiesById[field.id] = true;
    }
  }
  return fields.map((f) => visibilitiesById[f.id]);
}
