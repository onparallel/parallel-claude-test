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

export interface PetitionFieldLogicFieldCondition extends PetitionFieldLogicConditionBase {
  modifier: PetitionFieldLogicConditionMultipleValueModifier;
  fieldId: string;
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

export type PetitionFieldLogicConditionOperator =
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
  | "NUMBER_OF_SUBREPLIES"
  | "ANY_IS_IN_LIST"
  | "ALL_IS_IN_LIST"
  | "NONE_IS_IN_LIST"
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
  | "NOT_HAS_ANY_BG_CHECK_TOPICS";

export type PseudoPetitionFieldVisibilityConditionOperator =
  | PetitionFieldLogicConditionOperator
  | "HAVE_REPLY"
  | "NOT_HAVE_REPLY";

export type PetitionFieldMath = PetitionFieldMathRule[];

export interface PetitionFieldMathRule {
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition[];
  operations: PetitionFieldMathOperation[];
}

export type PetitionFieldMathOperand =
  | { type: "NUMBER"; value: number }
  | { type: "FIELD"; fieldId: string }
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

export interface FieldLogic {
  isVisible: boolean;
  headerNumber?: string | null;
  previousVariables: Record<string, number | string>;
  currentVariables: Record<string, number | string>;
  finalVariables: Record<string, number | string>;
  changes: FieldLogicChange[];
}

export interface FieldLogicChange {
  rule: PetitionFieldMathRule;
  operation: PetitionFieldMathOperation;
  operandValue: number | string | null;
  previousValue: number | string | null;
  newValue: number | string | null;
}

export interface FieldLogicResult extends FieldLogic {
  groupChildrenLogic?: FieldLogicChildLogicResult[][];
}

interface FieldLogicChildLogicResult extends FieldLogic {}
