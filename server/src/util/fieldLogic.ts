/**
 * Similar code is also on /client/utils/fieldLogic/useFieldLogic.ts
 * Don't forget to update it as well!
 */

import { filter, flatMap, flatMapToObj, indexBy, isDefined, pipe, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionField, PetitionFieldReply } from "../db/__types";
import { completedFieldReplies } from "./completedFieldReplies";
import { Maybe } from "./types";

export interface PetitionFieldVisibility {
  type: "SHOW" | "HIDE";
  operator: "AND" | "OR";
  conditions: PetitionFieldLogicCondition[];
}

export interface PetitionFieldLogicCondition {
  fieldId: number;
  column?: number;
  modifier: PetitionFieldLogicConditionMultipleValueModifier;
  operator: PetitionFieldLogicConditionOperator;
  value: string | string[] | number | null;
}

export type PetitionFieldLogicConditionMultipleValueModifier =
  | "ANY"
  | "ALL"
  | "NONE"
  | "NUMBER_OF_REPLIES";

export type PetitionFieldLogicConditionOperator =
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

interface FieldLogicResult {
  isVisible: boolean;
  groupChildrenLogic?: { isVisible: boolean }[][];
}

interface PetitionFieldInner<TID = number | string>
  extends Pick<PetitionField, "type" | "options" | "visibility"> {
  id: TID;
}

interface PetitionFieldReplyInner extends Pick<PetitionFieldReply, "content" | "anonymized_at"> {}

interface FieldLogicInput<TID = number | string> extends PetitionFieldInner<TID> {
  children?: Maybe<
    (PetitionFieldInner<TID> & {
      parent?: Maybe<Pick<PetitionFieldInner<TID>, "id">>;
      replies: PetitionFieldReplyInner[]; // children replies NOT GROUPED
    })[]
  >;
  replies: (PetitionFieldReplyInner & {
    children?: Maybe<
      {
        field: Pick<PetitionFieldInner<TID>, "id">;
        replies: PetitionFieldReplyInner[]; // children replies grouped by parentReplyId
      }[]
    >;
  })[];
}

export function applyFieldLogic<T extends FieldLogicInput>(fields: T[]): T[] {
  return zip(fields, evaluateFieldLogic(fields))
    .filter(([, { isVisible }]) => isVisible)
    .map(([field, { groupChildrenLogic }]) => ({
      ...field,
      replies: field.replies.map((r, groupIndex) => ({
        ...r,
        children:
          field.type === "FIELD_GROUP"
            ? r.children!.filter(
                (_, childReplyIndex) => groupChildrenLogic?.[groupIndex][childReplyIndex].isVisible,
              )
            : undefined,
      })),
    }));
}

export function evaluateFieldLogic(fields: FieldLogicInput[]): FieldLogicResult[] {
  return Array.from(
    (function* () {
      const fieldsById = pipe(
        fields,
        flatMap((f) => [f, ...(f.children ?? [])]),
        indexBy((f) => f.id),
      );
      const parentById = pipe(
        fields,
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
              replies = childFieldReplies[referencedField.id] ?? [];
            } else {
              replies = visibilitiesById[c.fieldId] ? referencedField.replies : [];
            }
            return conditionIsMet(c, referencedField, replies);
          });
          visibilitiesById[field.id] = type === "SHOW" ? result : !result;
        } else {
          visibilitiesById[field.id] = true;
        }
        if (isDefined(field.children)) {
          for (const child of field.children) {
            childFieldReplies[child.id] = [];
          }
          const childReplies = field.replies;
          const groupChildrenLogic = childReplies.map((reply) => {
            const groupVisibilityById: { [fieldId: string]: boolean } = {};
            return field.children!.map((child) => {
              if (!visibilitiesById[field.id]) {
                groupVisibilityById[child.id] = false;
              } else if (child.visibility) {
                const { conditions, operator, type } = child.visibility as PetitionFieldVisibility;
                const result = conditions[operator === "OR" ? "some" : "every"]((c) => {
                  // if field is not visible then count as if no replies
                  const referencedField = fieldsById[c.fieldId];
                  const parent = parentById[referencedField.id];
                  let replies: any[];
                  // if it belongs to the same FIELD_GROUP then only use replies in the same child reply
                  if (isDefined(parent) && parent.id === field.id) {
                    replies = groupVisibilityById[referencedField.id]
                      ? reply.children!.find((c) => c.field.id === referencedField.id)?.replies ??
                        []
                      : [];
                  } else if (isDefined(parent) && parent.id !== field.id) {
                    // if none of the child replies on that field were visible childFieldReplies[referencedField.id] === undefined
                    replies = childFieldReplies[referencedField.id] ?? [];
                  } else {
                    replies = visibilitiesById[referencedField.id] ? referencedField.replies : [];
                  }
                  return conditionIsMet(c, referencedField, replies);
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
  );
}

function conditionIsMet(
  condition: PetitionFieldLogicCondition,
  field: FieldLogicInput,
  replies: PetitionFieldReplyInner[],
) {
  const { operator, value, modifier } = condition;
  function evaluator(reply: PetitionFieldReplyInner) {
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
  operator: PetitionFieldLogicCondition["operator"],
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
