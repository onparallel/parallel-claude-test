import {
  PetitionFieldLogicConditionLogicalJoin,
  PetitionFieldLogicConditionMultipleValueModifier,
  PetitionFieldLogicConditionOperator,
  PetitionFieldLogicVariableCondition,
  PetitionFieldMathOperator,
  PetitionFieldVisibilityType,
} from "../../util/fieldLogic";

export interface PetitionFieldVisibility {
  type: PetitionFieldVisibilityType;
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition[];
}

export type PetitionFieldLogicCondition =
  | PetitionFieldLogicFieldCondition
  | PetitionFieldLogicVariableCondition;

export interface PetitionFieldLogicFieldCondition extends PetitionFieldLogicConditionBase {
  modifier: PetitionFieldLogicConditionMultipleValueModifier;
  fieldId: string;
  column?: number;
}

interface PetitionFieldLogicConditionBase {
  operator: PetitionFieldLogicConditionOperator;
  value: string | string[] | number | null;
}

export type PetitionFieldMath = PetitionFieldMathRule[];

export interface PetitionFieldMathRule {
  operator: PetitionFieldLogicConditionLogicalJoin;
  conditions: PetitionFieldLogicCondition[];
  operations: PetitionFieldMathOperation[];
}

export type PetitionFieldMathOperand =
  | { type: "NUMBER"; value: number }
  | { type: "FIELD"; fieldId: string }
  | { type: "VARIABLE"; name: string };

export interface PetitionFieldMathOperation {
  variable: string;
  operand: PetitionFieldMathOperand;
  operator: PetitionFieldMathOperator;
}
