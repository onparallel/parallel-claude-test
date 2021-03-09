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
import {
  PetitionFieldVisibility,
  PetitionFieldVisibilityCondition,
  PetitionFieldVisibilityConditionOperator,
} from "./types";

type VisibilityField =
  | useFieldVisibility_PublicPetitionFieldFragment
  | useFieldVisibility_PetitionFieldFragment;

function evaluatePredicate<T extends string | number>(
  reply: T,
  operator: PetitionFieldVisibilityConditionOperator,
  value: T | null
) {
  if (value === null) {
    return false;
  }
  const a = typeof reply === "string" ? reply.toLowerCase() : reply;
  const b = typeof value === "string" ? value.toLowerCase() : value;
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
  }
}

function conditionIsMet(
  condition: PetitionFieldVisibilityCondition,
  field: VisibilityField,
  isVisible: boolean
) {
  const replies = isVisible ? (field.replies as any[]) : [];
  switch (condition.modifier) {
    case "ANY":
      return replies.some((r) =>
        evaluatePredicate(r.content.text, condition.operator, condition.value)
      );
    case "ALL":
      return replies.every((r) =>
        evaluatePredicate(r.content.text, condition.operator, condition.value)
      );
    case "NONE":
      return !replies.some((r) =>
        evaluatePredicate(r.content.text, condition.operator, condition.value)
      );
    case "NUMBER_OF_REPLIES":
      return evaluatePredicate(
        replies.length,
        condition.operator,
        condition.value
      );
    default:
      return false;
  }
}

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
      visibility
      replies {
        id
        content
      }
    }
  `,
};
