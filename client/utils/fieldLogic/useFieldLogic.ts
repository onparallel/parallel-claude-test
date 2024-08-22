/**
 * Similar code is also on /server/src/utils/fieldLogic.ts
 * Don't forget to update it as well!
 */

import { gql } from "@apollo/client";
import {
  useFieldLogic_PetitionBaseFragment,
  useFieldLogic_PetitionFieldFragment,
  useFieldLogic_PublicPetitionFieldFragment,
  useFieldLogic_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { filter, flatMap, flatMapToObj, indexBy, isDefined, pipe } from "remeda";
import { assert } from "ts-essentials";
import { completedFieldReplies } from "../completedFieldReplies";
import {
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionOperator,
  PetitionFieldLogicFieldCondition,
  PetitionFieldLogicVariableCondition,
  PetitionFieldMath,
  PetitionFieldMathOperand,
  PetitionFieldMathOperation,
  PetitionFieldVisibility,
} from "./types";
import { UnwrapArray } from "../types";

type PetitionSelection = useFieldLogic_PetitionBaseFragment | useFieldLogic_PublicPetitionFragment;

type PetitionFieldSelection =
  | useFieldLogic_PublicPetitionFieldFragment
  | useFieldLogic_PetitionFieldFragment;

export interface FieldLogic {
  isVisible: boolean;
  previousVariables: Record<string, number>;
  currentVariables: Record<string, number>;
  finalVariables: Record<string, number>;
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
  petition: PetitionSelection,
  usePreviewReplies = false,
): FieldLogicResult[] {
  return useMemo(
    () =>
      Array.from(
        (function* () {
          const fields = petition.fields as PetitionFieldSelection[];
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
          const currentVariables = Object.fromEntries(
            petition.variables.map((v) => [v.name, v.defaultValue]),
          );

          function getReplies(
            referencedField:
              | PetitionFieldSelection
              | UnwrapArray<PetitionFieldSelection["children"]>,
          ) {
            const parent = parentById[referencedField.id];
            return isDefined(parent)
              ? // if field has parent use collected replies
                childFieldReplies[referencedField.id]
              : visibilitiesById[referencedField.id]
                ? usePreviewReplies && referencedField.__typename === "PetitionField"
                  ? (referencedField.previewReplies as any[])
                  : (referencedField.replies as any[])
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
            if (visibilitiesById[field.id] && isDefined(field.math)) {
              for (const {
                conditions,
                operator,
                operations,
              } of field.math as PetitionFieldMath[]) {
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

                function getReplies(
                  referencedField: UnwrapArray<PetitionFieldSelection["children"]>,
                ) {
                  const parent = parentById[referencedField.id];
                  // if it belongs to the same FIELD_GROUP then only use replies in the same child reply
                  if (isDefined(parent) && parent.id === field.id) {
                    return groupVisibilityById[referencedField.id]
                      ? (reply.children!.find((c) => c.field.id === referencedField.id)?.replies ??
                          [])
                      : [];
                  } else if (isDefined(parent) && parent.id !== field.id) {
                    // if none of the child replies on that field were visible childFieldReplies[referencedField.id] === undefined
                    return childFieldReplies[referencedField.id] ?? [];
                  } else {
                    return visibilitiesById[referencedField.id]
                      ? usePreviewReplies && referencedField.__typename === "PetitionField"
                        ? (referencedField.previewReplies as any[])
                        : (referencedField.replies as any[])
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
                    const { conditions, operator, type } =
                      child.visibility as PetitionFieldVisibility;

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
                    if (isDefined(child.math)) {
                      for (const {
                        conditions,
                        operator,
                        operations,
                      } of child.math as PetitionFieldMath[]) {
                        const conditionsApply = conditions[operator === "OR" ? "some" : "every"](
                          (c) => evaluateCondition(c),
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
              };
            } else {
              yield {
                isVisible: visibilitiesById[field.id],
                currentVariables: { ...currentVariables },
                previousVariables,
                finalVariables: currentVariables,
              };
            }
          }
        })(),
      ),
    [petition.fields, petition.variables],
  );
}

function fieldConditionIsMet(
  condition: PetitionFieldLogicFieldCondition,
  field: Pick<PetitionFieldSelection, "type" | "options">,
  replies: any[],
  petition: PetitionSelection,
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
  petition: PetitionSelection,
) {
  const { operator, value, variableName } = condition;
  return evaluatePredicate(currentVariables[variableName], operator, value, petition);
}

function evaluatePredicate(
  reply: string | number | string[],
  operator: PetitionFieldLogicConditionOperator,
  value: string | string[] | number | null,
  petition: PetitionSelection,
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
        const list = petition.customLists.find((l) => l.name === value);
        assert(isDefined(list));
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

useFieldLogic.fragments = {
  PublicPetition: gql`
    fragment useFieldLogic_PublicPetition on PublicPetition {
      variables {
        name
        defaultValue
      }
      customLists {
        name
        values
      }
      fields {
        ...useFieldLogic_PublicPetitionField
      }
    }
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
      math
    }
    ${completedFieldReplies.fragments.PublicPetitionField}
  `,
  PetitionBase: gql`
    fragment useFieldLogic_PetitionBase on PetitionBase {
      variables {
        name
        defaultValue
      }
      customLists {
        name
        values
      }
      fields {
        ...useFieldLogic_PetitionField
      }
    }
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
      math
    }
    ${completedFieldReplies.fragments.PetitionField}
  `,
};
