/**
 * Similar code is also on /server/src/utils/fieldVisibility.ts
 * Don't forget to update it as well!
 */

import { gql } from "@apollo/client";
import {
  useFieldVisibility_PublicPetitionFieldFragment,
  useFieldVisibility_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { indexBy } from "remeda";
import { completedFieldReplies } from "../completedFieldReplies";
import {
  PetitionFieldVisibility,
  PetitionFieldVisibilityCondition,
  PetitionFieldVisibilityConditionOperator,
} from "./types";

type VisibilityField =
  | useFieldVisibility_PublicPetitionFieldFragment
  | useFieldVisibility_PetitionFieldFragment;

function evaluatePredicate<T extends string | number>(
  reply: T | string[],
  operator: PetitionFieldVisibilityConditionOperator,
  value: T | null
) {
  if (value === null) {
    return false;
  }
  const a = typeof reply === "string" ? reply.toLowerCase() : reply;
  const b = Array.isArray(reply)
    ? value
    : typeof value === "string"
    ? value.toLowerCase()
    : value;

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
    case "NUMBER_OF_SUBREPLIES":
      return (a as string[]).length == b;
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
        ? reply.content.columns?.[condition.column]?.[1] ?? null
        : reply.content.text
        ? reply.content.text
        : reply.content.choices;

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
      const completed = completedFieldReplies(field);
      return evaluatePredicate(completed.length, operator, value);
    default:
      return false;
  }
}

/**
 * Evaluates the visibility of the fields based on the visibility conditions
 * and the replies.
 * Returns an array with the visibilities corresponding to each field in the
 * passed array of fields.
 */
export function useFieldVisibility<T extends VisibilityField>(fields: T[]) {
  return useMemo(() => {
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
  }, [fields]);
}

useFieldVisibility.fragments = {
  PublicPetitionField: gql`
    fragment useFieldVisibility_PublicPetitionField on PublicPetitionField {
      id
      type
      options
      visibility
      replies {
        id
        content
      }
    }
  `,
  PetitionField: gql`
    fragment useFieldVisibility_PetitionField on PetitionField {
      id
      type
      options
      visibility
      replies {
        id
        content
      }
    }
  `,
};
