export interface PetitionFieldVisibility {
  type: PetitionFieldVisibilityType;
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition[];
}

export type PetitionFieldVisibilityType = "SHOW" | "HIDE";

export type PetitionFieldLogicConditionLogicalJoin = "AND" | "OR";

export interface PetitionFieldLogicCondition {
  fieldId: string;
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

export type PseudoPetitionFieldVisibilityConditionOperator =
  | PetitionFieldLogicConditionOperator
  | "HAVE_REPLY"
  | "NOT_HAVE_REPLY";

export interface PetitionFieldMath {
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition[];
  operations: PetitionFieldMathOperation[];
}

type PetitionFieldMathOperand =
  | { type: "NUMBER"; value: number }
  | { type: "FIELD"; fieldId: string }
  | { type: "VARIABLE"; name: string };

type PetitionFieldMathOperator =
  | "ASSIGNATION"
  | "ADDITION"
  | "SUBSTRACTION"
  | "DIVISION"
  | "MULTIPLICATION";

export interface PetitionFieldMathOperation {
  variable: string;
  operand: PetitionFieldMathOperand;
  operator: PetitionFieldMathOperator;
}
