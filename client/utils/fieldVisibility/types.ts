export interface PetitionFieldVisibility {
  type: PetitionFieldVisibilityType;
  operator: PetitionFieldVisibilityOperator;
  conditions: PetitionFieldVisibilityCondition[];
}

export type PetitionFieldVisibilityType = "SHOW" | "HIDE";

export type PetitionFieldVisibilityOperator = "AND" | "OR";

export interface PetitionFieldVisibilityCondition {
  fieldId: string;
  modifier: PetitionFieldVisibilityConditionModifier;
  operator: PetitionFieldVisibilityConditionOperator;
  value: string | number | null;
  column?: number;
}

export type ConditionValue = string | number | null;

export type PetitionFieldVisibilityConditionModifier =
  | "ANY"
  | "ALL"
  | "NONE"
  | "NUMBER_OF_REPLIES";

export type PetitionFieldVisibilityConditionOperator =
  | "EQUAL"
  | "NOT_EQUAL"
  | "START_WITH"
  | "END_WITH"
  | "CONTAIN"
  | "NOT_CONTAIN"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "NUMBER_OF_SUBREPLIES";

export type PseudoPetitionFieldVisibilityConditionOperator =
  | PetitionFieldVisibilityConditionOperator
  | "HAVE_REPLY"
  | "NOT_HAVE_REPLY";
