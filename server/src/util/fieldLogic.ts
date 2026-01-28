/**
 * Similar code is also on
 * - client/utils/fieldLogic/fieldLogic.ts
 * - server/src/pdf/utils/fieldLogic.ts
 * Don't forget to update it as well.
 */
import { filter, flatMap, fromEntries, indexBy, isNonNullish, isNullish, pipe, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldType } from "../db/__types";
import { completedFieldReplies } from "./completedFieldReplies";
import { letters, numbers, romanNumerals } from "./generators";
import { never } from "./never";
import { UnwrapArray } from "./types";

export interface PetitionFieldLogic {
  visibility: PetitionFieldVisibility | null;
  math: PetitionFieldMath | null;
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
  | "HAS_BG_CHECK_RESULTS"
  | "NOT_HAS_BG_CHECK_RESULTS"
  | "HAS_BG_CHECK_MATCH"
  | "NOT_HAS_BG_CHECK_MATCH"
  | "HAS_PENDING_REVIEW"
  | "NOT_HAS_PENDING_REVIEW"
  | "HAS_BG_CHECK_TOPICS"
  | "NOT_HAS_BG_CHECK_TOPICS"
  | "HAS_ANY_BG_CHECK_TOPICS"
  | "NOT_HAS_ANY_BG_CHECK_TOPICS"
  | PetitionFieldLogicConditionListOperator;

export type PetitionFieldMath = PetitionFieldMathRule[];

export interface PetitionFieldMathRule {
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition[];
  operations: PetitionFieldMathOperation[];
}

type PetitionFieldMathOperand =
  | { type: "NUMBER"; value: number }
  | { type: "FIELD"; fieldId: number }
  | { type: "VARIABLE"; name: string }
  | { type: "ENUM"; value: string };

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
  previousVariables: Record<string, number | string>;
  currentVariables: Record<string, number | string>;
  finalVariables: Record<string, number | string>;
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
  math: PetitionFieldMath | null;
}
interface FieldLogicPetitionFieldInput extends FieldLogicPetitionFieldInner {
  children?:
    | (FieldLogicPetitionFieldInner & { replies: FieldLogicPetitionFieldReplyInner[] })[]
    | null;
  replies: (FieldLogicPetitionFieldReplyInner & {
    children?: { field: { id: number }; replies: FieldLogicPetitionFieldReplyInner[] }[] | null;
  })[];
}

export interface FieldLogicPetitionInput<TFieldInput = FieldLogicPetitionFieldInput> {
  variables: (
    | { type: "NUMBER"; name: string; defaultValue: number }
    | { type: "ENUM"; name: string; defaultValue: string; valueLabels: { value: string }[] }
  )[];
  customLists: { name: string; values: string[] }[];
  automaticNumberingConfig: { numberingType: "NUMBERS" | "LETTERS" | "ROMAN_NUMERALS" } | null;
  standardListDefinitions: { listName: string; values: { key: string }[] }[];
  fields: TFieldInput[];
}

export function mapFieldLogic<
  TIn extends number | string,
  TOut extends number | string = TIn extends number ? string : number,
>(
  field: { visibility?: PetitionFieldVisibility | null; math?: PetitionFieldMath | null },
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
  math: PetitionFieldMath,
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

export function applyFieldVisibility<T extends FieldLogicPetitionInput>(
  petition: T,
  evaluatedLogic?: FieldLogicResult[],
): T["fields"] {
  return zip(petition.fields, evaluatedLogic ?? evaluateFieldLogic(petition))
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
        currentVariables: Record<string, number | string>,
      ): number | string | null {
        if (operand.type === "NUMBER") {
          return operand.value;
        } else if (operand.type === "FIELD") {
          const referencedField = fieldsById[operand.fieldId];
          const replies = getReplies(referencedField);
          return replies.length > 0 ? (replies[0].content.value as number) : null;
        } else if (operand.type === "VARIABLE") {
          return currentVariables[operand.name];
        } else if (operand.type === "ENUM") {
          return operand.value;
        } else {
          never("Unimplemented operand type");
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
                  petition.variables,
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
              currentVariables: Record<string, number | string>,
            ): number | string | null {
              if (operand.type === "NUMBER") {
                return operand.value;
              } else if (operand.type === "FIELD") {
                const referencedField = fieldsById[operand.fieldId];
                const replies = getReplies(referencedField);
                return replies.length > 0 ? (replies[0].content.value as number) : null;
              } else if (operand.type === "VARIABLE") {
                return currentVariables[operand.name];
              } else if (operand.type === "ENUM") {
                return operand.value;
              } else {
                never("Unimplemented operand type");
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
                          petition.variables,
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
    switch (operator) {
      case "HAS_BG_CHECK_RESULTS":
        assert(field.type === "BACKGROUND_CHECK");
        assert(isNonNullish(reply.content?.search?.totalCount));
        return reply.content.search.totalCount > 0;
      case "NOT_HAS_BG_CHECK_RESULTS":
        assert(field.type === "BACKGROUND_CHECK");
        assert(isNonNullish(reply.content?.search?.totalCount));
        return reply.content.search.totalCount === 0;
      case "HAS_BG_CHECK_MATCH":
        assert(field.type === "BACKGROUND_CHECK");
        return isNonNullish(reply.content?.entity);
      case "NOT_HAS_BG_CHECK_MATCH":
        assert(field.type === "BACKGROUND_CHECK");
        return isNullish(reply.content?.entity);
      case "HAS_PENDING_REVIEW":
        assert(field.type === "BACKGROUND_CHECK");
        assert(isNonNullish(reply.content.search));
        return (
          reply.content.search.totalCount > 0 &&
          reply.content.search.falsePositivesCount !== reply.content.search.totalCount &&
          isNullish(reply.content.entity)
        );
      case "NOT_HAS_PENDING_REVIEW":
        assert(field.type === "BACKGROUND_CHECK");
        assert(isNonNullish(reply.content.search));
        return (
          reply.content.search.totalCount === 0 ||
          reply.content.search.falsePositivesCount === reply.content.search.totalCount ||
          isNonNullish(reply.content.entity)
        );
      case "HAS_BG_CHECK_TOPICS":
        assert(field.type === "BACKGROUND_CHECK");
        assert(Array.isArray(value));
        return (
          value.length > 0 &&
          isNonNullish(reply.content.entity?.properties?.topics) &&
          value.every((topic) => reply.content.entity.properties.topics.includes(topic))
        );
      case "NOT_HAS_BG_CHECK_TOPICS":
        assert(field.type === "BACKGROUND_CHECK");
        assert(Array.isArray(value));
        return (
          value.length > 0 &&
          isNonNullish(reply.content.entity) &&
          (isNullish(reply.content.entity?.properties?.topics) ||
            reply.content.entity.properties.topics.length === 0 ||
            value.every((topic) => !reply.content.entity.properties.topics.includes(topic)))
        );
      case "HAS_ANY_BG_CHECK_TOPICS":
        assert(field.type === "BACKGROUND_CHECK");
        return (
          isNonNullish(reply.content.entity?.properties?.topics) &&
          reply.content.entity.properties.topics.length > 0
        );
      case "NOT_HAS_ANY_BG_CHECK_TOPICS":
        assert(field.type === "BACKGROUND_CHECK");
        return (
          isNullish(reply.content.entity?.properties?.topics) ||
          reply.content.entity.properties.topics.length === 0
        );
      case "HAS_PROFILE_MATCH":
        assert(field.type === "PROFILE_SEARCH");
        assert(Array.isArray(reply.content.value));
        return reply.content.value.length > 0;

      default: {
        const _value =
          condition.column !== undefined
            ? (reply.content.value?.[condition.column]?.[1] ?? null)
            : reply.content.value;

        return evaluateValuePredicate(_value, operator, value, petition, field.type);
      }
    }
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
      return evaluateValuePredicate(completed.length, operator, value, petition, field.type);
    default:
      return false;
  }
}

function variableConditionIsMet(
  condition: PetitionFieldLogicVariableCondition,
  currentVariables: Record<string, number | string>,
  petition: FieldLogicPetitionInput,
) {
  const { operator, value, variableName } = condition;

  const variable = petition.variables.find((v) => v.name === variableName);
  assert(isNonNullish(variable), `Variable ${variableName} not found`);

  if (variable.type === "NUMBER") {
    return evaluateValuePredicate(currentVariables[variableName], operator, value, petition);
  } else if (variable.type === "ENUM") {
    return evaluateEnumPredicate(
      currentVariables[variableName],
      operator,
      value,
      variable.valueLabels.map((v) => v.value),
    );
  } else {
    never("Unimplemented variable type");
  }
}

function evaluateValuePredicate(
  reply: string | number | string[] | number[],
  operator: PetitionFieldLogicConditionOperator,
  value: string | string[] | number | null,
  petition: FieldLogicPetitionInput,
  fieldType?: PetitionFieldType, // this is required to distinguish between empty CHECKBOX and empty PROFILE_SEARCH reply
) {
  function isInList(listName: string, reply: any) {
    const customList = petition.customLists.find((l) => l.name === listName);
    if (isNonNullish(customList)) {
      return customList.values.some((v) => v === reply);
    }
    const standardList = petition.standardListDefinitions.find((l) => l.listName === listName);
    if (isNonNullish(standardList)) {
      return standardList.values.some((v) => v.key === reply);
    }
    return false;
  }

  try {
    if (reply === undefined || isNullish(value)) {
      return false;
    }

    // CHECKBOX
    if (fieldType === "CHECKBOX" && Array.isArray(reply)) {
      switch (operator) {
        case "CONTAIN":
          assert(typeof value === "string");
          return reply.includes(value);
        case "NOT_CONTAIN":
          assert(typeof value === "string");
          return !reply.includes(value);
        case "IS_ONE_OF":
        case "NOT_IS_ONE_OF": {
          assert(Array.isArray(value));
          const selectedValues = reply.filter((r) => typeof r === "string");
          const result = selectedValues.some((r) => value.includes(r));
          return operator.startsWith("NOT_") ? !result : result;
        }
        case "NUMBER_OF_SUBREPLIES":
          assert(typeof value === "number");
          return reply.length === value;
        case "ALL_IS_IN_LIST":
          assert(typeof value === "string");
          return reply.every((r) => isInList(value, r));
        case "ANY_IS_IN_LIST":
          assert(typeof value === "string");
          return reply.some((r) => isInList(value, r));
        case "NONE_IS_IN_LIST":
          assert(typeof value === "string");
          return !reply.some((r) => isInList(value, r));
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
        assert(typeof reply === "string");
        assert(typeof value === "string");
        const result = isInList(value, reply);
        return operator.startsWith("NOT_") ? !result : result;
      }
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
}

function evaluateEnumPredicate(
  currentValue: string | number,
  operator: PetitionFieldLogicConditionOperator,
  value: string | string[] | number | null,
  options: string[],
) {
  assert(
    typeof currentValue === "string",
    `expected currentValue to be string, got ${typeof currentValue}`,
  );
  assert(typeof value === "string", `expected value to be string, got ${typeof value}`);
  assert(
    options.some((v) => v === currentValue),
    `expected currentValue to be one of the options`,
  );
  assert(
    options.some((v) => v === value),
    `expected value to be one of the options`,
  );

  switch (operator) {
    case "EQUAL":
      return currentValue === value;
    case "NOT_EQUAL":
      return currentValue !== value;
    case "LESS_THAN":
      return options.indexOf(currentValue) < options.indexOf(value);
    case "LESS_THAN_OR_EQUAL":
      return options.indexOf(currentValue) <= options.indexOf(value);
    case "GREATER_THAN":
      return options.indexOf(currentValue) > options.indexOf(value);
    case "GREATER_THAN_OR_EQUAL":
      return options.indexOf(currentValue) >= options.indexOf(value);
    default:
      throw new Error(`Unimplemented operator ${operator} for ENUM condition`);
  }
}

function applyMathOperation(
  operation: PetitionFieldMathOperation,
  currentVariables: Record<string, number | string>,
  value: number | string | null,
  variables: FieldLogicPetitionInput["variables"],
) {
  const variable = variables.find((v) => v.name === operation.variable);
  assert(isNonNullish(variable), `Variable ${operation.variable} not found`);
  const currentValue = currentVariables[operation.variable];

  if (variable.type === "NUMBER") {
    currentVariables[operation.variable] = applyMathNumberOperation(currentValue, operation, value);
  } else if (variable.type === "ENUM") {
    currentVariables[operation.variable] = applyMathEnumOperation(
      currentValue,
      operation,
      value,
      variable.valueLabels.map((v) => v.value),
    );
  }
}

function applyMathNumberOperation(
  currentValue: number | string,
  operation: PetitionFieldMathOperation,
  value: number | string | null,
) {
  let result: number;

  assert(
    typeof currentValue === "number",
    `expected currentValue to be number, got ${typeof currentValue}`,
  );
  assert(
    value === null || typeof value === "number",
    `expected value to be number or null, got ${typeof value}`,
  );
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
      default:
        never(`Invalid operator ${operation.operator} for NUMBER math operation`);
    }
  }
  if (!isFinite(result)) {
    result = NaN;
  }

  return result;
}

function applyMathEnumOperation(
  currentValue: number | string,
  operation: PetitionFieldMathOperation,
  value: number | string | null,
  options: string[],
) {
  assert(
    typeof currentValue === "string",
    `current value for variable ${operation.variable} is not a string`,
  );
  assert(typeof value === "string", `value for variable ${operation.variable} is not a string`);
  let result: string;

  if (currentValue === value) {
    result = currentValue;
  } else {
    switch (operation.operator) {
      case "ASSIGNATION":
        result = value;
        break;
      case "ASSIGNATION_IF_LOWER":
        result = options.indexOf(value) < options.indexOf(currentValue) ? value : currentValue;
        break;
      case "ASSIGNATION_IF_GREATER":
        result = options.indexOf(value) > options.indexOf(currentValue) ? value : currentValue;
        break;
      default:
        never(`Invalid operator ${operation.operator} for ENUM math operation`);
    }
  }

  return result;
}

export function evaluateVisibilityArray<T extends { visibility?: any | null }>(
  petition: FieldLogicPetitionInput,
  data: T[],
) {
  if (data.length === 0) {
    // early return as slice(0) is a no-op and will give incorrect result
    return [];
  }

  return evaluateFieldLogic({
    ...petition,
    // add 1 mock field for each item in data array, to be able to evaluate their visibilities based on previous fields
    fields: petition.fields.concat(
      data.map(({ visibility }) => ({
        id: 0, // ID does not matter, as this "fields" will never be referenced
        type: "HEADING" as const,
        visibility: visibility ?? null,
        options: {},
        replies: [],
        math: null,
      })),
    ),
  }).slice(
    -data.length, // only return the last N items, which are the logic results for the data array
  );
}
