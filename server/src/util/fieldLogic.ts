/**
 * Similar code is also on /client/utils/fieldLogic/useFieldLogic.ts
 * Don't forget to update it as well!
 */

import { filter, flatMap, flatMapToObj, indexBy, isNonNullish, pipe, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionField, PetitionFieldReply } from "../db/__types";
import type {
  AutomaticNumberingConfig,
  PetitionCustomList,
  PetitionVariable,
} from "../db/repositories/PetitionRepository";
import { letters, numbers, romanNumerals } from "./autoIncremental";
import { completedFieldReplies } from "./completedFieldReplies";
import { fromGlobalId, toGlobalId } from "./globalId";
import { Maybe, UnwrapArray } from "./types";

type PetitionFieldVisibilityType = "SHOW" | "HIDE";

type PetitionFieldLogicConditionLogicalJoin = "AND" | "OR";

export interface PetitionFieldVisibility<TID extends number | string = number> {
  type: PetitionFieldVisibilityType;
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition<TID>[];
}

export type PetitionFieldLogicCondition<TID extends number | string = number> =
  | PetitionFieldLogicFieldCondition<TID>
  | PetitionFieldLogicVariableCondition;

interface PetitionFieldLogicFieldCondition<TID extends number | string = number>
  extends PetitionFieldLogicConditionBase {
  modifier: PetitionFieldLogicConditionMultipleValueModifier;
  fieldId: TID;
  column?: number;
}

interface PetitionFieldLogicVariableCondition extends PetitionFieldLogicConditionBase {
  variableName: string;
}

interface PetitionFieldLogicConditionBase {
  operator: PetitionFieldLogicConditionOperator;
  value: string | string[] | number | null;
}

type PetitionFieldLogicConditionMultipleValueModifier =
  | "ANY"
  | "ALL"
  | "NONE"
  | "NUMBER_OF_REPLIES";

type PetitionFieldLogicConditionOperator =
  | "EQUAL"
  | "NOT_EQUAL"
  | "START_WITH"
  | "END_WITH"
  | "CONTAIN"
  | "NOT_CONTAIN"
  | "IS_ONE_OF"
  | "NOT_IS_ONE_OF"
  | "IS_IN_LIST"
  | "NOT_IS_IN_LIST"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "NUMBER_OF_SUBREPLIES";

export interface PetitionFieldMath<TID extends number | string = number> {
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition<TID>[];
  operations: PetitionFieldMathOperation<TID>[];
}

type PetitionFieldMathOperand<TID extends number | string = number> =
  | { type: "NUMBER"; value: number }
  | { type: "FIELD"; fieldId: TID }
  | { type: "VARIABLE"; name: string };

type PetitionFieldMathOperator =
  | "ASSIGNATION"
  | "ADDITION"
  | "SUBSTRACTION"
  | "MULTIPLICATION"
  | "DIVISION";

export interface PetitionFieldMathOperation<TID extends number | string = number> {
  variable: string;
  operand: PetitionFieldMathOperand<TID>;
  operator: PetitionFieldMathOperator;
}

export interface PetitionFieldLogic<TID extends number | string = number> {
  visibility: Maybe<PetitionFieldVisibility<TID>>;
  math: Maybe<PetitionFieldMath<TID>[]>;
}

interface FieldLogic {
  isVisible: boolean;
  headerNumber?: string | null;
  previousVariables: Record<string, number>;
  currentVariables: Record<string, number>;
  finalVariables: Record<string, number>;
}

export interface FieldLogicResult extends FieldLogic {
  groupChildrenLogic?: FieldLogic[][];
}

interface PetitionFieldInner<TID = number | string>
  extends Pick<PetitionField, "type" | "options" | "visibility" | "math"> {
  id: TID;
}

interface PetitionFieldReplyInner extends Pick<PetitionFieldReply, "content" | "anonymized_at"> {}

interface FieldLogicPetitionFieldInput<TID = number | string> extends PetitionFieldInner<TID> {
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

interface FieldLogicPetitionInput<TID = number | string> {
  variables: PetitionVariable[];
  fields: FieldLogicPetitionFieldInput<TID>[];
  custom_lists: PetitionCustomList[];
  automatic_numbering_config?: AutomaticNumberingConfig | null;
}

/** maps fieldIds inside logic condition from globalId to number and vice-versa */
export function mapFieldLogicCondition<
  TIn extends number | string,
  TOut extends number | string = TIn extends number ? string : number,
>(c: PetitionFieldLogicCondition<TIn>): PetitionFieldLogicCondition<TOut> {
  if ("fieldId" in c) {
    return {
      ...c,
      fieldId: (typeof c.fieldId === "string"
        ? fromGlobalId(c.fieldId, "PetitionField").id
        : typeof c.fieldId === "number"
          ? toGlobalId("PetitionField", c.fieldId)
          : (null as never)) as TOut,
    };
  } else {
    return c;
  }
}

/** maps fieldIds inside math operation from globalId to number and vice-versa */
export function mapFieldMathOperation<
  TIn extends number | string,
  TOut extends number | string = TIn extends number ? string : number,
>(op: PetitionFieldMathOperation<TIn>): PetitionFieldMathOperation<TOut> {
  function mapFieldMathOperand(
    operand: PetitionFieldMathOperand<TIn>,
  ): PetitionFieldMathOperand<TOut> {
    if (operand.type === "FIELD") {
      return {
        ...operand,
        fieldId: (typeof operand.fieldId === "string"
          ? fromGlobalId(operand.fieldId, "PetitionField").id
          : typeof operand.fieldId === "number"
            ? toGlobalId("PetitionField", operand.fieldId)
            : (null as never)) as TOut,
      };
    } else {
      return operand;
    }
  }

  return {
    ...op,
    operand: mapFieldMathOperand(op.operand),
  };
}

export function applyFieldVisibility<T extends FieldLogicPetitionInput>(petition: T): T["fields"] {
  return zip(petition.fields, evaluateFieldLogic(petition))
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

export function evaluateFieldLogic<T extends FieldLogicPetitionInput>(
  petition: T,
): FieldLogicResult[] {
  const headerNumbers =
    petition.automatic_numbering_config?.numbering_type === "NUMBERS"
      ? numbers()
      : petition.automatic_numbering_config?.numbering_type === "LETTERS"
        ? letters()
        : petition.automatic_numbering_config?.numbering_type === "ROMAN_NUMERALS"
          ? romanNumerals()
          : null;

  return Array.from(
    (function* () {
      const fields = petition.fields;
      const fieldsById = pipe(
        fields,
        flatMap((f) => [f, ...(f.children ?? [])]),
        indexBy((f) => f.id),
      );
      const parentById = pipe(
        fields,
        filter((f) => isNonNullish(f.children)),
        flatMapToObj((f) => f.children!.map((c) => [c.id, f])),
      );
      const visibilitiesById: { [fieldId: string]: boolean } = {};
      // we need to collect visible replies for child fields so that these fields can be referenced
      // later in fields outside the field group and only visible replies are taken into account
      const childFieldReplies: { [fieldId: string]: any[] } = {};
      const currentVariables = Object.fromEntries(
        (petition.variables ?? []).map((v) => [v.name, v.default_value]),
      );

      function getReplies(referencedField: FieldLogicPetitionFieldInput) {
        const parent = parentById[referencedField.id];
        return isNonNullish(parent)
          ? // if field has parent use collected replies
            childFieldReplies[referencedField.id]
          : visibilitiesById[referencedField.id]
            ? (referencedField.replies as any[])
            : // if field is not visible then count as if no replies
              [];
      }

      function evaluateCondition(
        condition: PetitionFieldLogicCondition,
        petition: FieldLogicPetitionInput,
      ) {
        if ("fieldId" in condition) {
          const referencedField = fieldsById[condition.fieldId];
          return fieldConditionIsMet(
            condition,
            referencedField,
            getReplies(referencedField),
            petition,
          );
        } else {
          return variableConditionIsMet(condition, currentVariables, petition);
        }
      }

      function getOperandValue(
        operand: PetitionFieldMathOperand,
        currentVariables: Record<string, number>,
      ): number | null {
        if (operand.type === "NUMBER") {
          return operand.value;
        } else if (operand.type === "FIELD") {
          const referencedField = fieldsById[operand.fieldId];
          const replies = getReplies(referencedField);
          return replies.length > 0 ? (replies[0].content.value as number) : null;
        } else {
          return currentVariables[operand.name];
        }
      }

      function getNextEnumeration(field: Pick<PetitionField, "type" | "options">) {
        if (
          isNonNullish(headerNumbers) &&
          field.type === "HEADING" &&
          field.options.showNumbering
        ) {
          return `${headerNumbers.next().value}`;
        }

        return null;
      }

      for (const field of fields) {
        const previousVariables = { ...currentVariables };
        if (field.visibility) {
          const { conditions, operator, type } = field.visibility as PetitionFieldVisibility;
          const result = conditions[operator === "OR" ? "some" : "every"]((c) =>
            evaluateCondition(c, petition),
          );
          visibilitiesById[field.id] = type === "SHOW" ? result : !result;
        } else {
          visibilitiesById[field.id] = true;
        }
        if (visibilitiesById[field.id] && isNonNullish(field.math)) {
          for (const { conditions, operator, operations } of field.math as PetitionFieldMath[]) {
            const conditionsApply = conditions[operator === "OR" ? "some" : "every"]((c) =>
              evaluateCondition(c, petition),
            );
            if (conditionsApply) {
              for (const operation of operations) {
                applyMathOperation(
                  operation,
                  currentVariables,
                  getOperandValue(operation.operand, currentVariables),
                );
              }
            }
          }
        }
        if (isNonNullish(field.children)) {
          for (const child of field.children) {
            childFieldReplies[child.id] = [];
          }
          const childReplies = field.replies;
          const groupChildrenLogic = childReplies.map((reply) => {
            const groupVisibilityById: { [fieldId: string]: boolean } = {};

            function getReplies(
              referencedField: UnwrapArray<FieldLogicPetitionFieldInput["children"]>,
            ) {
              const parent = parentById[referencedField.id];
              // if it belongs to the same FIELD_GROUP then only use replies in the same child reply
              if (isNonNullish(parent) && parent.id === field.id) {
                return groupVisibilityById[referencedField.id]
                  ? (reply.children!.find((c) => c.field.id === referencedField.id)?.replies ?? [])
                  : [];
              } else if (isNonNullish(parent) && parent.id !== field.id) {
                // if none of the child replies on that field were visible childFieldReplies[referencedField.id] === undefined
                return childFieldReplies[referencedField.id] ?? [];
              } else {
                return visibilitiesById[referencedField.id]
                  ? (referencedField.replies as any[])
                  : [];
              }
            }

            function evaluateCondition(condition: PetitionFieldLogicCondition) {
              if ("fieldId" in condition) {
                const referencedField = fieldsById[condition.fieldId];
                return fieldConditionIsMet(
                  condition,
                  referencedField,
                  getReplies(referencedField),
                  petition,
                );
              } else {
                return variableConditionIsMet(condition, currentVariables, petition);
              }
            }

            function getOperandValue(
              operand: PetitionFieldMathOperand,
              currentVariables: Record<string, number>,
            ): number | null {
              if (operand.type === "NUMBER") {
                return operand.value;
              } else if (operand.type === "FIELD") {
                const referencedField = fieldsById[operand.fieldId];
                const replies = getReplies(referencedField);
                return replies.length > 0 ? (replies[0].content.value as number) : null;
              } else {
                return currentVariables[operand.name];
              }
            }

            return field.children!.map((child) => {
              const previousVariables = { ...currentVariables };
              if (!visibilitiesById[field.id]) {
                groupVisibilityById[child.id] = false;
              } else if (child.visibility) {
                const { conditions, operator, type } = child.visibility as PetitionFieldVisibility;

                const result = conditions[operator === "OR" ? "some" : "every"]((c) =>
                  evaluateCondition(c),
                );
                groupVisibilityById[child.id] = type === "SHOW" ? result : !result;
              } else {
                groupVisibilityById[child.id] = true;
              }
              if (groupVisibilityById[child.id]) {
                // collect visible replies
                childFieldReplies[child.id].push(
                  ...(reply.children!.find((c) => c.field.id === child.id)?.replies ?? []),
                );
                if (isNonNullish(child.math)) {
                  for (const {
                    conditions,
                    operator,
                    operations,
                  } of child.math as PetitionFieldMath[]) {
                    const conditionsApply = conditions[operator === "OR" ? "some" : "every"]((c) =>
                      evaluateCondition(c),
                    );
                    if (conditionsApply) {
                      for (const operation of operations) {
                        applyMathOperation(
                          operation,
                          currentVariables,
                          getOperandValue(operation.operand, currentVariables),
                        );
                      }
                    }
                  }
                }
              }
              return {
                isVisible: groupVisibilityById[child.id],
                currentVariables: { ...currentVariables },
                previousVariables,
                finalVariables: currentVariables,
              };
            });
          });
          yield {
            isVisible: visibilitiesById[field.id],
            currentVariables: { ...currentVariables },
            previousVariables,
            finalVariables: currentVariables,
            groupChildrenLogic,
            headerNumber: null,
          };
        } else {
          yield {
            isVisible: visibilitiesById[field.id],
            currentVariables: { ...currentVariables },
            previousVariables,
            finalVariables: currentVariables,
            headerNumber: visibilitiesById[field.id] ? getNextEnumeration(field) : null,
          };
        }
      }
    })(),
  );
}

function fieldConditionIsMet(
  condition: PetitionFieldLogicFieldCondition,
  field: PetitionFieldInner,
  replies: any[],
  petition: FieldLogicPetitionInput,
) {
  const { operator, value, modifier } = condition;
  function evaluator(reply: any) {
    const _value =
      condition.column !== undefined
        ? (reply.content.value?.[condition.column]?.[1] ?? null)
        : reply.content.value;

    return evaluatePredicate(_value, operator, value, petition);
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
      return evaluatePredicate(completed.length, operator, value, petition);
    default:
      return false;
  }
}

function variableConditionIsMet(
  condition: PetitionFieldLogicVariableCondition,
  currentVariables: Record<string, number>,
  petition: FieldLogicPetitionInput,
) {
  const { operator, value, variableName } = condition;
  return evaluatePredicate(currentVariables[variableName], operator, value, petition);
}

function evaluatePredicate(
  reply: string | number | string[],
  operator: PetitionFieldLogicConditionOperator,
  value: string | string[] | number | null,
  petition: FieldLogicPetitionInput,
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
      case "NOT_CONTAIN": {
        assert(typeof _reply === "string");
        assert(typeof _value === "string");
        const result = _reply.includes(_value);
        return operator.startsWith("NOT_") ? !result : result;
      }
      case "IS_ONE_OF":
      case "NOT_IS_ONE_OF": {
        assert(typeof _reply === "string");
        assert(Array.isArray(_value));
        const result = _value.includes(_reply);
        return operator.startsWith("NOT_") ? !result : result;
      }
      case "IS_IN_LIST":
      case "NOT_IS_IN_LIST": {
        assert(typeof _reply === "string");
        assert(typeof value === "string");
        const list = petition.custom_lists?.find((l) => l.name === value);
        assert(isNonNullish(list));
        const result = list.values.some((v) => v.toLowerCase() === _reply);
        return operator.startsWith("NOT_") ? !result : result;
      }
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
}

function applyMathOperation(
  operation: PetitionFieldMathOperation,
  currentVariables: Record<string, number>,
  value: number | null,
) {
  const currentValue = currentVariables[operation.variable];
  let result: number;
  if (Number.isNaN(currentValue) || value === null) {
    result = NaN;
  } else {
    switch (operation.operator) {
      case "ASSIGNATION":
        result = value;
        break;
      case "ADDITION":
        result = currentValue + value;
        break;
      case "SUBSTRACTION":
        result = currentValue - value;
        break;
      case "MULTIPLICATION":
        result = currentValue * value;
        break;
      case "DIVISION":
        result = currentValue / value;
        break;
    }
  }
  if (!isFinite(result)) {
    result = NaN;
  }
  currentVariables[operation.variable] = result;
}
