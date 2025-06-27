/**
 * Similar code is also on /client/utils/fieldLogic/fieldLogic.ts
 * Don't forget to update it as well!
 */

import { filter, flatMap, fromEntries, indexBy, isNonNullish, pipe, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldType } from "../db/__types";
import { completedFieldReplies } from "./completedFieldReplies";
import { letters, numbers, romanNumerals } from "./generators";
import { UnwrapArray } from "./types";

export interface PetitionFieldLogic {
  visibility: PetitionFieldVisibility | null;
  math: PetitionFieldMath[] | null;
}
export interface PetitionFieldVisibility {
  type: PetitionFieldVisibilityType;
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition[];
}

export type PetitionFieldVisibilityType = "SHOW" | "HIDE";

export type PetitionFieldLogicConditionLogicalJoin = "AND" | "OR";

export type PetitionFieldLogicCondition =
  | PetitionFieldLogicFieldCondition
  | PetitionFieldLogicVariableCondition;

interface PetitionFieldLogicFieldCondition extends PetitionFieldLogicConditionBase {
  modifier: PetitionFieldLogicConditionMultipleValueModifier;
  fieldId: number;
  column?: number;
}

export interface PetitionFieldLogicVariableCondition extends PetitionFieldLogicConditionBase {
  variableName: string;
}

interface PetitionFieldLogicConditionBase {
  operator: PetitionFieldLogicConditionOperator;
  value: string | string[] | number | null;
}

export type PetitionFieldLogicConditionMultipleValueModifier =
  | "ANY"
  | "ALL"
  | "NONE"
  | "NUMBER_OF_REPLIES";

type PetitionFieldLogicConditionListOperator =
  | "IS_IN_LIST"
  | "NOT_IS_IN_LIST"
  | "ALL_IS_IN_LIST"
  | "ANY_IS_IN_LIST"
  | "NONE_IS_IN_LIST";

function isFieldLogicConditionListOperator(
  operator: PetitionFieldLogicConditionOperator,
): operator is PetitionFieldLogicConditionListOperator {
  return [
    "IS_IN_LIST",
    "NOT_IS_IN_LIST",
    "ALL_IS_IN_LIST",
    "ANY_IS_IN_LIST",
    "NONE_IS_IN_LIST",
  ].includes(operator);
}

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
  | "NUMBER_OF_SUBREPLIES"
  | "HAS_PROFILE_MATCH"
  | PetitionFieldLogicConditionListOperator;

export interface PetitionFieldMath {
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition[];
  operations: PetitionFieldMathOperation[];
}

type PetitionFieldMathOperand =
  | { type: "NUMBER"; value: number }
  | { type: "FIELD"; fieldId: number }
  | { type: "VARIABLE"; name: string };

export type PetitionFieldMathOperator =
  | "ASSIGNATION"
  | "ASSIGNATION_IF_LOWER"
  | "ASSIGNATION_IF_GREATER"
  | "ADDITION"
  | "SUBSTRACTION"
  | "MULTIPLICATION"
  | "DIVISION";

export interface PetitionFieldMathOperation {
  variable: string;
  operand: PetitionFieldMathOperand;
  operator: PetitionFieldMathOperator;
}

interface FieldLogic {
  isVisible: boolean;
  headerNumber?: string | null;
  previousVariables: Record<string, number>;
  currentVariables: Record<string, number>;
  finalVariables: Record<string, number>;
}

export interface FieldLogicResult extends FieldLogic {
  groupChildrenLogic?: FieldLogicChildLogicResult[][];
}

interface FieldLogicChildLogicResult extends FieldLogic {}

interface FieldLogicPetitionFieldReplyInner {
  content: any;
  anonymized_at: Date | null;
}

interface FieldLogicPetitionFieldInner {
  id: number;
  type: PetitionFieldType;
  options: any;
  visibility: PetitionFieldVisibility | null;
  math: PetitionFieldMath[] | null;
}
interface FieldLogicPetitionFieldInput extends FieldLogicPetitionFieldInner {
  children?:
    | (FieldLogicPetitionFieldInner & { replies: FieldLogicPetitionFieldReplyInner[] })[]
    | null;
  replies: (FieldLogicPetitionFieldReplyInner & {
    children?: { field: { id: number }; replies: FieldLogicPetitionFieldReplyInner[] }[] | null;
  })[];
}

export interface FieldLogicPetitionInput {
  variables: { name: string; defaultValue: number }[];
  customLists: { name: string; values: string[] }[];
  automaticNumberingConfig: { numberingType: "NUMBERS" | "LETTERS" | "ROMAN_NUMERALS" } | null;
  standardListDefinitions: { listName: string; values: { key: string }[] }[];
  fields: FieldLogicPetitionFieldInput[];
}

export function mapFieldLogic<
  TIn extends number | string,
  TOut extends number | string = TIn extends number ? string : number,
>(
  field: { visibility?: PetitionFieldVisibility | null; math?: PetitionFieldMath[] | null },
  idMapper: (id: TIn) => TOut,
) {
  const lists = new Set<string>();
  return {
    field: {
      visibility: field.visibility
        ? mapFieldVisibility(field.visibility, idMapper, (listName) => lists.add(listName))
        : null,
      math: field.math
        ? mapFieldMath(field.math, idMapper, (listName) => lists.add(listName))
        : null,
    },
    referencedLists: Array.from(lists),
  };
}

function mapFieldVisibility<
  TIn extends number | string,
  TOut extends number | string = TIn extends number ? string : number,
>(
  visibility: PetitionFieldVisibility,
  idMapper: (fieldId: TIn) => TOut,
  onStandardListReferenced: (listName: string) => void,
) {
  return {
    ...visibility,
    conditions: visibility.conditions.map((c) =>
      mapFieldLogicCondition(c, idMapper, onStandardListReferenced),
    ),
  };
}

function mapFieldMath<
  TIn extends number | string,
  TOut extends number | string = TIn extends number ? string : number,
>(
  math: PetitionFieldMath[],
  idMapper: (fieldId: TIn) => TOut,
  onStandardListReferenced: (listName: string) => void,
) {
  return math.map((m) => ({
    ...m,
    conditions: m.conditions.map((c) =>
      mapFieldLogicCondition(c, idMapper, onStandardListReferenced),
    ),
    operations: m.operations.map((op) => mapFieldMathOperation(op, idMapper)),
  }));
}

/** maps fieldIds inside logic condition from globalId to number and vice-versa */
function mapFieldLogicCondition<
  TIn extends number | string,
  TOut extends number | string = TIn extends number ? string : number,
>(
  c: PetitionFieldLogicCondition,
  idMapper: (fieldId: TIn) => TOut,
  onStandardListReferenced: (listName: string) => void,
) {
  if (isFieldLogicConditionListOperator(c.operator) && typeof c.value === "string") {
    onStandardListReferenced(c.value);
  }

  if ("fieldId" in c) {
    return {
      ...c,
      fieldId: idMapper(c.fieldId as TIn),
    };
  } else {
    return c;
  }
}

/** maps fieldIds inside math operation from globalId to number and vice-versa */
function mapFieldMathOperation<
  TIn extends number | string,
  TOut extends number | string = TIn extends number ? string : number,
>(op: PetitionFieldMathOperation, idMapper: (fieldId: TIn) => TOut) {
  function mapFieldMathOperand(operand: PetitionFieldMathOperand) {
    if (operand.type === "FIELD") {
      return {
        ...operand,
        fieldId: idMapper(operand.fieldId as TIn),
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

export function evaluateFieldLogic(petition: FieldLogicPetitionInput): FieldLogicResult[] {
  const headerNumbers =
    petition.automaticNumberingConfig?.numberingType === "NUMBERS"
      ? numbers()
      : petition.automaticNumberingConfig?.numberingType === "LETTERS"
        ? letters()
        : petition.automaticNumberingConfig?.numberingType === "ROMAN_NUMERALS"
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
        flatMap((f) => f.children!.map((c) => [c.id, f] as const)),
        fromEntries(),
      );
      const visibilitiesById: { [fieldId: string]: boolean } = {};
      // we need to collect visible replies for child fields so that these fields can be referenced
      // later in fields outside the field group and only visible replies are taken into account
      const childFieldReplies: { [fieldId: string]: FieldLogicPetitionFieldReplyInner[] } = {};
      const currentVariables = Object.fromEntries(
        petition.variables.map((v) => [v.name, v.defaultValue]),
      );

      function getReplies(referencedField: FieldLogicPetitionFieldInput) {
        const parent = parentById[referencedField.id];
        return isNonNullish(parent)
          ? // if field has parent use collected replies
            childFieldReplies[referencedField.id]
          : visibilitiesById[referencedField.id]
            ? referencedField.replies
            : // if field is not visible then count as if no replies
              [];
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

      function getNextEnumeration(field: Pick<FieldLogicPetitionFieldInner, "type" | "options">) {
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
            evaluateCondition(c),
          );
          visibilitiesById[field.id] = type === "SHOW" ? result : !result;
        } else {
          visibilitiesById[field.id] = true;
        }
        if (visibilitiesById[field.id] && isNonNullish(field.math)) {
          for (const { conditions, operator, operations } of field.math as PetitionFieldMath[]) {
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
                return visibilitiesById[referencedField.id] ? referencedField.replies : [];
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
  field: Pick<FieldLogicPetitionFieldInner, "type" | "options">,
  replies: FieldLogicPetitionFieldReplyInner[],
  petition: FieldLogicPetitionInput,
) {
  const { operator, value, modifier } = condition;
  function evaluator(reply: FieldLogicPetitionFieldReplyInner) {
    const _value =
      condition.column !== undefined
        ? (reply.content.value?.[condition.column]?.[1] ?? null)
        : reply.content.value;

    return evaluatePredicate(_value, operator, value, petition, field.type);
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
      return evaluatePredicate(completed.length, operator, value, petition, field.type);
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
  reply: string | number | string[] | number[],
  operator: PetitionFieldLogicConditionOperator,
  value: string | string[] | number | null,
  petition: FieldLogicPetitionInput,
  fieldType?: PetitionFieldType, // this is required to distinguish between empty CHECKBOX and empty PROFILE_SEARCH reply
) {
  try {
    if (reply === undefined) {
      return false;
    }

    // PROFILE_SEARCH
    if (fieldType === "PROFILE_SEARCH" && Array.isArray(reply)) {
      switch (operator) {
        case "HAS_PROFILE_MATCH":
          return reply.length > 0;
        default:
          return false;
      }
    }

    if (value === undefined || value === null) {
      return false;
    }

    // CHECKBOX
    if (fieldType === "CHECKBOX" && Array.isArray(reply)) {
      const standardList = petition.standardListDefinitions.find((l) => l.listName === value);

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
        case "ALL_IS_IN_LIST":
          assert(typeof value === "string");
          assert(isNonNullish(standardList));
          return reply.every((value) => standardList.values.some((v) => v.key === value));
        case "ANY_IS_IN_LIST":
          assert(typeof value === "string");
          assert(isNonNullish(standardList));
          return reply.some((value) => standardList.values.some((v) => v.key === value));
        case "NONE_IS_IN_LIST":
          assert(typeof value === "string");
          assert(isNonNullish(standardList));
          return !reply.some((value) => standardList.values.some((v) => v.key === value));
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
        const customList = petition.customLists.find((l) => l.name === value);
        const standardList = petition.standardListDefinitions.find((l) => l.listName === value);

        let result;
        if (isNonNullish(customList)) {
          result = customList.values.some((v) => v.toLowerCase() === _reply);
        } else if (isNonNullish(standardList)) {
          result = standardList.values.some((v) => v.key.toLowerCase() === _reply);
        }

        assert(isNonNullish(result), `Can't find list ${value} referenced in condition`);
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
      case "ASSIGNATION_IF_LOWER":
        result = Math.min(currentValue, value);
        break;
      case "ASSIGNATION_IF_GREATER":
        result = Math.max(currentValue, value);
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
