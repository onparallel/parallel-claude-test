/**
 * Similar code is also on /server/src/utils/fieldLogic.ts
 * Don't forget to update it as well!
 */

import { gql } from "@apollo/client";
import {
  useFieldLogic_PetitionFieldFragment,
  useFieldLogic_PublicPetitionFieldFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { filter, flatMap, flatMapToObj, indexBy, isDefined, pipe } from "remeda";
import { assert } from "ts-essentials";
import { completedFieldReplies } from "../completedFieldReplies";
import { UnionToArrayUnion } from "../types";
import {
  PetitionFieldVisibility,
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionOperator,
} from "./types";

type PetitionFieldSelection =
  | useFieldLogic_PublicPetitionFieldFragment
  | useFieldLogic_PetitionFieldFragment;

export interface FieldLogic {
  isVisible: boolean;
}

export interface FieldLogicResult extends FieldLogic {
  groupChildrenLogic?: FieldLogicChildLogicResult[][];
}

export interface FieldLogicChildLogicResult extends FieldLogic {}

/**
 * Evaluates the visibility of the fields based on the visibility conditions
 * and the replies.
 * Returns an array with the visibilities corresponding to each field in the
 * passed array of fields.
 */
export function useFieldLogic(
  fields: UnionToArrayUnion<PetitionFieldSelection>,
  usePreviewReplies = false,
): FieldLogicResult[] {
  return useMemo(
    () =>
      Array.from(
        (function* () {
          const fieldsById = pipe(
            fields as PetitionFieldSelection[],
            flatMap((f) => [f, ...(f.children ?? [])]),
            indexBy((f) => f.id),
          );
          const parentById = pipe(
            fields as PetitionFieldSelection[],
            filter((f) => isDefined(f.children)),
            flatMapToObj((f) => f.children!.map((c) => [c.id, f])),
          );
          const visibilitiesById: { [fieldId: string]: boolean } = {};
          // we need to collect visible replies for child fields so that these fields can be referenced
          // later in fields outside the field group and only visible replies are taken into account
          const childFieldReplies: { [fieldId: string]: any[] } = {};
          for (const field of fields) {
            if (field.visibility) {
              const { conditions, operator, type } = field.visibility as PetitionFieldVisibility;
              const result = conditions[operator === "OR" ? "some" : "every"]((c) => {
                const referencedField = fieldsById[c.fieldId];
                const parent = parentById[referencedField.id];
                let replies: any;
                if (isDefined(parent)) {
                  replies = childFieldReplies[referencedField.id];
                } else {
                  // if field is not visible then count as if no replies
                  replies = visibilitiesById[c.fieldId]
                    ? usePreviewReplies && referencedField.__typename === "PetitionField"
                      ? (referencedField.previewReplies as any[])
                      : (referencedField.replies as any[])
                    : [];
                }
                return fieldConditionIsMet(c, referencedField, replies);
              });
              visibilitiesById[field.id] = type === "SHOW" ? result : !result;
            } else {
              visibilitiesById[field.id] = true;
            }
            if (isDefined(field.children)) {
              for (const child of field.children) {
                childFieldReplies[child.id] = [];
              }
              const childReplies =
                usePreviewReplies && field.__typename === "PetitionField"
                  ? field.previewReplies
                  : field.replies;
              const groupChildrenLogic = childReplies.map((reply) => {
                const groupVisibilityById: { [fieldId: string]: boolean } = {};
                return field.children!.map((child) => {
                  if (!visibilitiesById[field.id]) {
                    groupVisibilityById[child.id] = false;
                  } else if (child.visibility) {
                    const { conditions, operator, type } =
                      child.visibility as PetitionFieldVisibility;
                    const result = conditions[operator === "OR" ? "some" : "every"]((c) => {
                      // if field is not visible then count as if no replies
                      const referencedField = fieldsById[c.fieldId];
                      const parent = parentById[referencedField.id];
                      let replies: any[];
                      // if it belongs to the same FIELD_GROUP then only use replies in the same child reply
                      if (isDefined(parent) && parent.id === field.id) {
                        replies = groupVisibilityById[referencedField.id]
                          ? reply.children!.find((c) => c.field.id === referencedField.id)
                              ?.replies ?? []
                          : [];
                      } else if (isDefined(parent) && parent.id !== field.id) {
                        // if none of the child replies on that field were visible childFieldReplies[referencedField.id] === undefined
                        replies = childFieldReplies[referencedField.id] ?? [];
                      } else {
                        replies = visibilitiesById[referencedField.id]
                          ? usePreviewReplies && referencedField.__typename === "PetitionField"
                            ? (referencedField.previewReplies as any[])
                            : (referencedField.replies as any[])
                          : [];
                      }
                      return fieldConditionIsMet(c, referencedField, replies);
                    });
                    groupVisibilityById[child.id] = type === "SHOW" ? result : !result;
                  } else {
                    groupVisibilityById[child.id] = true;
                  }
                  if (groupVisibilityById[child.id]) {
                    // collect visible replies
                    childFieldReplies[child.id].push(
                      ...(reply.children!.find((c) => c.field.id === child.id)?.replies ?? []),
                    );
                  }
                  return { isVisible: groupVisibilityById[child.id] };
                });
              });
              yield {
                isVisible: visibilitiesById[field.id],
                groupChildrenLogic,
              };
            } else {
              yield { isVisible: visibilitiesById[field.id] };
            }
          }
        })(),
      ),
    [fields],
  );
}

function fieldConditionIsMet(
  condition: PetitionFieldLogicCondition,
  field: Pick<PetitionFieldSelection, "type" | "options">,
  replies: any[],
) {
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

function evaluatePredicate(
  reply: string | number | string[],
  operator: PetitionFieldLogicConditionOperator,
  value: string | string[] | number | null,
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

useFieldLogic.fragments = {
  PublicPetitionField: gql`
    fragment useFieldLogic_PublicPetitionField on PublicPetitionField {
      ...useFieldLogic_PublicPetitionFieldInner
      children {
        ...useFieldLogic_PublicPetitionFieldInner
        parent {
          id
        }
        replies {
          id
          content
        }
      }
      replies {
        id
        content
        children {
          field {
            id
          }
          replies {
            id
            content
          }
        }
      }
      ...completedFieldReplies_PublicPetitionField
    }
    fragment useFieldLogic_PublicPetitionFieldInner on PublicPetitionField {
      id
      type
      options
      visibility
    }
    ${completedFieldReplies.fragments.PublicPetitionField}
  `,
  PetitionField: gql`
    fragment useFieldLogic_PetitionField on PetitionField {
      ...useFieldLogic_PetitionFieldInner
      children {
        ...useFieldLogic_PetitionFieldInner
        parent {
          id
        }
        replies {
          id
          content
        }
        previewReplies @client {
          id
          content
        }
      }
      replies {
        id
        content
        children {
          field {
            id
          }
          replies {
            id
            content
          }
        }
      }
      previewReplies @client {
        id
        content
        children {
          field {
            id
            parent {
              id
            }
          }
          replies {
            id
            content
          }
        }
      }
      ...completedFieldReplies_PetitionField
    }
    fragment useFieldLogic_PetitionFieldInner on PetitionField {
      id
      type
      options
      visibility
    }
    ${completedFieldReplies.fragments.PetitionField}
  `,
};
