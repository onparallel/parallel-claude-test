/**
 * Similar code is also on /server/src/utils/fieldVisibility.ts
 * Don't forget to update it as well!
 */

import { gql } from "@apollo/client";
import {
  useFieldVisibility_PetitionFieldFragment,
  useFieldVisibility_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { indexBy } from "remeda";
import { assert } from "ts-essentials";
import { completedFieldReplies } from "../completedFieldReplies";
import { UnionToArrayUnion } from "../types";
import {
  PetitionFieldVisibility,
  PetitionFieldVisibilityCondition,
  PetitionFieldVisibilityConditionOperator,
} from "./types";

type PetitionFieldSelection =
  | useFieldVisibility_PublicPetitionFieldFragment
  | useFieldVisibility_PetitionFieldFragment;

function evaluatePredicate(
  reply: string | number | string[],
  operator: PetitionFieldVisibilityConditionOperator,
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
  field: PetitionFieldSelection,
  isVisible: boolean,
  isCacheOnly: boolean
) {
  const replies = isVisible
    ? isCacheOnly && field.__typename === "PetitionField"
      ? (field.previewReplies as any[])
      : (field.replies as any[])
    : [];
  const { operator, value, modifier } = condition;
  function evaluator(reply: any) {
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

/**
 * Evaluates the visibility of the fields based on the visibility conditions
 * and the replies.
 * Returns an array with the visibilities corresponding to each field in the
 * passed array of fields.
 */
export function useFieldVisibility(
  fields: UnionToArrayUnion<PetitionFieldSelection>,
  usePreviewReplies = false
) {
  return useMemo(() => {
    const fieldsById = indexBy<PetitionFieldSelection>(fields, (f) => f.id);
    const visibilitiesById: { [fieldId: string]: boolean } = {};
    for (const field of fields) {
      if (field.visibility) {
        const { conditions, operator, type } = field.visibility as PetitionFieldVisibility;
        const result = conditions[operator === "OR" ? "some" : "every"]((c) =>
          conditionIsMet(c, fieldsById[c.fieldId], visibilitiesById[c.fieldId], usePreviewReplies)
        );
        visibilitiesById[field.id] = type === "SHOW" ? result : !result;
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
      isInternal
      replies {
        id
        content
      }
      ...completedFieldReplies_PublicPetitionField
    }
    ${completedFieldReplies.fragments.PublicPetitionField}
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
        isAnonymized
      }
      previewReplies @client {
        id
        content
      }
      ...completedFieldReplies_PetitionField
    }
    ${completedFieldReplies.fragments.PetitionField}
  `,
};
