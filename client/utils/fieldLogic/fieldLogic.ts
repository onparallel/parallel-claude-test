/**
 * Similar code is also on /server/src/utils/fieldLogic.ts
 * Don't forget to update it as well!
 */

import { PetitionFieldType } from "@parallel/graphql/__types";
import { filter, flatMap, fromEntries, indexBy, isNonNullish, pipe } from "remeda";
import { assert } from "ts-essentials";
import { completedFieldReplies } from "../completedFieldReplies";
import { letters, numbers, romanNumerals } from "../generators";
import { UnwrapArray } from "../types";
import {
  FieldLogicResult,
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionOperator,
  PetitionFieldLogicFieldCondition,
  PetitionFieldLogicVariableCondition,
  PetitionFieldMath,
  PetitionFieldMathOperand,
  PetitionFieldMathOperation,
  PetitionFieldVisibility,
} from "./types";

export interface FieldLogicPetitionInput {
  variables: { name: string; defaultValue: number }[];
  customLists: { name: string; values: string[] }[];
  automaticNumberingConfig: { numberingType: "NUMBERS" | "LETTERS" | "ROMAN_NUMERALS" } | null;
  standardListDefinitions: { listName: string; values: { key: string }[] }[];
  fields: FieldLogicPetitionFieldInput[];
}

interface FieldLogicPetitionFieldReplyInner {
  id: string;
  content: any;
  isAnonymized: boolean;
}

interface FieldLogicPetitionFieldInner {
  id: string;
  type: PetitionFieldType;
  options: any;
  visibility: PetitionFieldVisibility | null;
  math: PetitionFieldMath | null;
}
interface FieldLogicPetitionFieldInput extends FieldLogicPetitionFieldInner {
  children?:
    | (FieldLogicPetitionFieldInner & { replies: FieldLogicPetitionFieldReplyInner[] })[]
    | null;
  replies: (FieldLogicPetitionFieldReplyInner & {
    children?: { field: { id: string }; replies: FieldLogicPetitionFieldReplyInner[] }[] | null;
  })[];
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
          for (const { conditions, operator, operations } of field.math) {
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
                  for (const { conditions, operator, operations } of child.math) {
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
  reply: string | number | string[] | any[],
  operator: PetitionFieldLogicConditionOperator,
  value: string | string[] | number | null,
  petition: FieldLogicPetitionInput,
  fieldType?: PetitionFieldType,
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
