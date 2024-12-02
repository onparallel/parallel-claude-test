import { isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { ProfileTypeField } from "../db/__types";
import { NexusGenInputs } from "../graphql/__types";
import { never } from "./never";
import { isValidDate } from "./time";

export type ProfileFieldValuesFilter =
  | ProfileFieldValuesFilterGroup
  | ProfileFieldValuesFilterCondition;

export interface ProfileFieldValuesFilterGroup {
  logicalOperator: "AND" | "OR";
  conditions: ProfileFieldValuesFilter[];
}

export const ProfileFieldValuesFilterOperatorValues = [
  "HAS_VALUE",
  "NOT_HAS_VALUE",
  "EQUAL",
  "NOT_EQUAL",
  "START_WITH",
  "END_WITH",
  "CONTAIN",
  "NOT_CONTAIN",
  "IS_ONE_OF",
  "NOT_IS_ONE_OF",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "HAS_BG_CHECK_RESULTS",
  "NOT_HAS_BG_CHECK_RESULTS",
  "HAS_BG_CHECK_MATCH",
  "NOT_HAS_BG_CHECK_MATCH",
  "HAS_BG_CHECK_TOPICS",
  "NOT_HAS_BG_CHECK_TOPICS",
  "HAS_ANY_BG_CHECK_TOPICS",
  "NOT_HAS_ANY_BG_CHECK_TOPICS",
  "IS_EXPIRED",
  "EXPIRES_IN",
  "HAS_EXPIRY",
  "NOT_HAS_EXPIRY",
] as const;

export type ProfileFieldValuesFilterOperator =
  (typeof ProfileFieldValuesFilterOperatorValues)[number];

export interface ProfileFieldValuesFilterCondition {
  profileTypeFieldId: number;
  operator: ProfileFieldValuesFilterOperator;
  value?: number | string | string[];
}

const MAX_GROUP_DEPTH = 3;

function checkMaxGroupDepth(value: ProfileFieldValuesFilter, current = 0) {
  if ("conditions" in value) {
    assert(current < MAX_GROUP_DEPTH, `Max condition depth allowed is ${MAX_GROUP_DEPTH}`);
    for (const condition of value.conditions) {
      checkMaxGroupDepth(condition, current + 1);
    }
  }
}

function validateSchema(
  value: NexusGenInputs["ProfileFieldValuesFilter"],
  profileTypeFields: Record<number, ProfileTypeField>,
): value is ProfileFieldValuesFilter {
  if ("conditions" in value) {
    assert(
      isNonNullish(value.logicalOperator) && ["AND", "OR"].includes(value.logicalOperator),
      "logicalOperator is not defined in group value filter",
    );
    assert(isNonNullish(value.conditions), "conditions is not defined in group value filter");
    for (const condition of value.conditions) {
      validateSchema(condition, profileTypeFields);
    }
    assert(isNullish(value.operator), "operator not allowed on group filter");
    assert(isNullish(value.value), "value not allowed on group filter");
  } else {
    assert(
      isNonNullish(value.profileTypeFieldId) && value.profileTypeFieldId in profileTypeFields,
      "profileTypeFieldId is not a valid profile type field ID",
    );
    assert(isNonNullish(value.operator), "operator is not defined");
    assert(isNullish(value.logicalOperator), "logicalOperator not allowed on condition filter");
    assert(isNullish(value.conditions), "conditions not allowed on condition filter");
    const profileTypeField = profileTypeFields[value.profileTypeFieldId];
    assert(isNonNullish(profileTypeField), "profileTypeFieldId is not valid");
    if (["IS_EXPIRED", "EXPIRES_IN", "HAS_EXPIRY", "NOT_HAS_EXPIRY"].includes(value.operator)) {
      assert(profileTypeField.is_expirable, "profileTypeFieldId is not expirable");
      if (["IS_EXPIRED", "HAS_EXPIRY", "NOT_HAS_EXPIRY"].includes(value.operator)) {
        assert(isNullish(value.value), `value not needed when ${value.operator}`);
      } else if (value.operator === "EXPIRES_IN") {
        assert(
          typeof value.value === "string" && value.value.match(/^P\d+[YMWD]$/),
          `value is not a valid duration "${/^P\d+[YMWD]$/}"`,
        );
      }
    } else if (["HAS_VALUE", "NOT_HAS_VALUE"].includes(value.operator)) {
      assert(isNullish(value.value), `value not needed when ${value.operator}`);
    } else {
      switch (profileTypeField.type) {
        case "TEXT":
        case "SHORT_TEXT":
          validateOperator(
            value.operator,
            [
              "EQUAL",
              "NOT_EQUAL",
              "START_WITH",
              "END_WITH",
              "CONTAIN",
              "NOT_CONTAIN",
              "IS_ONE_OF",
              "NOT_IS_ONE_OF",
            ],
            profileTypeField,
          );
          if (
            ["EQUAL", "NOT_EQUAL", "START_WITH", "END_WITH", "CONTAIN", "NOT_CONTAIN"].includes(
              value.operator,
            )
          ) {
            validateValue(value.value, "string");
          } else if (["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(value.operator)) {
            validateValue(value.value, "string", true);
          }
          break;
        case "NUMBER":
          validateOperator(
            value.operator,
            [
              "EQUAL",
              "NOT_EQUAL",
              "LESS_THAN",
              "LESS_THAN_OR_EQUAL",
              "GREATER_THAN",
              "GREATER_THAN_OR_EQUAL",
            ],
            profileTypeField,
          );
          validateValue(value.value, "number");
          break;
        case "DATE":
          validateOperator(
            value.operator,
            [
              "EQUAL",
              "NOT_EQUAL",
              "LESS_THAN",
              "LESS_THAN_OR_EQUAL",
              "GREATER_THAN",
              "GREATER_THAN_OR_EQUAL",
            ],
            profileTypeField,
          );
          validateValue(value.value, "string");
          assert(isValidDate(value.value as string), "value is not a valid date");
          break;
        case "PHONE":
          validateOperator(value.operator, ["EQUAL", "NOT_EQUAL"], profileTypeField);
          validateValue(value.value, "string");
          break;
        case "SELECT":
          validateOperator(
            value.operator,
            ["EQUAL", "NOT_EQUAL", "IS_ONE_OF", "NOT_IS_ONE_OF"],
            profileTypeField,
          );
          if (["EQUAL", "NOT_EQUAL"].includes(value.operator)) {
            validateValue(value.value, "string");
          } else if (["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(value.operator)) {
            validateValue(value.value, "string", true);
          }
          break;
        case "CHECKBOX":
          validateOperator(
            value.operator,
            ["EQUAL", "NOT_EQUAL", "CONTAIN", "NOT_CONTAIN"],
            profileTypeField,
          );
          validateValue(value.value, "string", true);
          break;
        case "BACKGROUND_CHECK":
          validateOperator(
            value.operator,
            [
              "HAS_BG_CHECK_RESULTS",
              "NOT_HAS_BG_CHECK_RESULTS",
              "HAS_BG_CHECK_MATCH",
              "NOT_HAS_BG_CHECK_MATCH",
              "HAS_BG_CHECK_TOPICS",
              "NOT_HAS_BG_CHECK_TOPICS",
              "HAS_ANY_BG_CHECK_TOPICS",
              "NOT_HAS_ANY_BG_CHECK_TOPICS",
            ],
            profileTypeField,
          );
          if (
            [
              "HAS_BG_CHECK_RESULTS",
              "NOT_HAS_BG_CHECK_RESULTS",
              "HAS_BG_CHECK_MATCH",
              "NOT_HAS_BG_CHECK_MATCH",
              "HAS_ANY_BG_CHECK_TOPICS",
              "NOT_HAS_ANY_BG_CHECK_TOPICS",
            ].includes(value.operator)
          ) {
            assert(isNullish(value.value), `value not needed when ${value.operator}`);
          }
          if (["HAS_BG_CHECK_TOPICS", "NOT_HAS_BG_CHECK_TOPICS"].includes(value.operator)) {
            validateValue(value.value, "string", true);
          }
          break;
        case "FILE":
          // any other operator besides HAS_VALUE and NOT_HAS_VALUE is not allowed on FILEs
          never();
      }
    }
  }
  return true;
}

function validateOperator(
  operator: ProfileFieldValuesFilterOperator,
  validOperators: ProfileFieldValuesFilterOperator[],
  profileTypeField: ProfileTypeField,
) {
  assert(
    validOperators.includes(operator),
    `operator ${operator} not allowed with profile type field type ${profileTypeField.type}`,
  );
}

function validateValue(value: any, type: "string" | "number", isArray: boolean = false) {
  if (isArray) {
    assert(
      Array.isArray(value) && value.length > 0 && value.every((i) => typeof i === type),
      `value should be a non-empty ${type}[]`,
    );
  } else {
    assert(typeof value === type, `value should be a ${type}`);
  }
}

export function validateProfileFieldValuesFilter(
  value: NexusGenInputs["ProfileFieldValuesFilter"],
  profileTypeFields: Record<number, ProfileTypeField>,
): value is ProfileFieldValuesFilter {
  validateSchema(value, profileTypeFields);
  checkMaxGroupDepth(value as ProfileFieldValuesFilter);
  return true;
}
