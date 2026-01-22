import { isNonNullish, isNullish } from "remeda";
import { assert } from "ts-essentials";
import { ProfileStatus, ProfileStatusValues, ProfileTypeField } from "../db/__types";
import { NexusGenInputs } from "../graphql/__types";
import { fromGlobalId, isGlobalId } from "./globalId";
import { never } from "./never";
import { isValidDate } from "./time";

export const ProfileQueryFilterOperatorValues = [
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
  "HAS_PENDING_REVIEW",
  "NOT_HAS_PENDING_REVIEW",
] as const;

export const ProfileQueryFilterPropertyValues = [
  "id",
  "status",
  "createdAt",
  "updatedAt",
  "closedAt",
] as const;

export const ProfileQueryFilterGroupLogicalOperatorValues = ["AND", "OR"] as const;
export type ProfileQueryFilterGroupLogicalOperator =
  (typeof ProfileQueryFilterGroupLogicalOperatorValues)[number];

export type ProfileQueryFilter =
  | ProfileQueryFilterGroup
  | ProfileQueryFilterFieldValueCondition
  | ProfileQueryFilterPropertyCondition;

interface ProfileQueryFilterGroup {
  logicalOperator: ProfileQueryFilterGroupLogicalOperator;
  conditions: ProfileQueryFilter[];
}

export type ProfileQueryFilterOperator = (typeof ProfileQueryFilterOperatorValues)[number];
type ProfileQueryFilterProperty = (typeof ProfileQueryFilterPropertyValues)[number];

interface ProfileQueryFilterFieldValueCondition {
  profileTypeFieldId: number;
  operator: ProfileQueryFilterOperator;
  value?: number | string | string[];
}

interface ProfileQueryFilterPropertyCondition {
  property: ProfileQueryFilterProperty;
  operator: ProfileQueryFilterOperator;
  value?: number | string | string[];
}

const MAX_GROUP_DEPTH = 4;

export function mapAndValidateProfileQueryFilter(
  value: NexusGenInputs["ProfileQueryFilterInput"] | null | undefined,
  profileTypeFields: Record<number, ProfileTypeField> | undefined,
  profileStatus: ProfileStatus[] = ProfileStatusValues,
  depth = 0,
): ProfileQueryFilter | null | undefined {
  if (isNullish(value)) {
    return value;
  }

  if ("conditions" in value) {
    assert(depth < MAX_GROUP_DEPTH - 1, `Max condition depth allowed is ${MAX_GROUP_DEPTH - 1}`);
    assert(
      isNonNullish(value.logicalOperator) && ["AND", "OR"].includes(value.logicalOperator),
      "logicalOperator is not defined in group value filter",
    );
    assert(
      isNonNullish(value.conditions) && value.conditions.length > 0,
      "conditions is not defined in group value filter",
    );
    assert(isNullish(value.operator), "operator not allowed on group filter");
    assert(isNullish(value.value), "value not allowed on group filter");
    return {
      logicalOperator: value.logicalOperator,
      conditions: value.conditions.map(
        (condition) =>
          mapAndValidateProfileQueryFilter(condition, profileTypeFields, profileStatus, depth + 1)!,
      ),
    };
  } else if ("profileTypeFieldId" in value) {
    assert(
      isNonNullish(profileTypeFields),
      "Must filter by a single profileTypeId when applying a profileTypeFieldId filter",
    );
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
          validateOperator(value.operator, [
            "EQUAL",
            "NOT_EQUAL",
            "START_WITH",
            "END_WITH",
            "CONTAIN",
            "NOT_CONTAIN",
            "IS_ONE_OF",
            "NOT_IS_ONE_OF",
          ]);
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
          validateOperator(value.operator, [
            "EQUAL",
            "NOT_EQUAL",
            "LESS_THAN",
            "LESS_THAN_OR_EQUAL",
            "GREATER_THAN",
            "GREATER_THAN_OR_EQUAL",
          ]);
          validateValue(value.value, "number");
          break;
        case "DATE":
          validateOperator(value.operator, [
            "EQUAL",
            "NOT_EQUAL",
            "LESS_THAN",
            "LESS_THAN_OR_EQUAL",
            "GREATER_THAN",
            "GREATER_THAN_OR_EQUAL",
          ]);
          validateValue(value.value, "string");
          assert(isValidDate(value.value as string), "value is not a valid date");
          break;
        case "PHONE":
          validateOperator(value.operator, ["EQUAL", "NOT_EQUAL"]);
          validateValue(value.value, "string");
          break;
        case "SELECT":
          validateOperator(value.operator, ["EQUAL", "NOT_EQUAL", "IS_ONE_OF", "NOT_IS_ONE_OF"]);
          if (["EQUAL", "NOT_EQUAL"].includes(value.operator)) {
            validateValue(value.value, "string");
          } else if (["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(value.operator)) {
            validateValue(value.value, "string", true);
          }
          break;
        case "CHECKBOX":
          validateOperator(value.operator, ["EQUAL", "NOT_EQUAL", "CONTAIN", "NOT_CONTAIN"]);
          validateValue(value.value, "string", true);
          break;
        case "BACKGROUND_CHECK":
          validateOperator(value.operator, [
            "HAS_BG_CHECK_RESULTS",
            "NOT_HAS_BG_CHECK_RESULTS",
            "HAS_BG_CHECK_MATCH",
            "NOT_HAS_BG_CHECK_MATCH",
            "HAS_BG_CHECK_TOPICS",
            "NOT_HAS_BG_CHECK_TOPICS",
            "HAS_ANY_BG_CHECK_TOPICS",
            "NOT_HAS_ANY_BG_CHECK_TOPICS",
            "HAS_PENDING_REVIEW",
            "NOT_HAS_PENDING_REVIEW",
          ]);
          if (
            [
              "HAS_BG_CHECK_RESULTS",
              "NOT_HAS_BG_CHECK_RESULTS",
              "HAS_BG_CHECK_MATCH",
              "NOT_HAS_BG_CHECK_MATCH",
              "HAS_ANY_BG_CHECK_TOPICS",
              "NOT_HAS_ANY_BG_CHECK_TOPICS",
              "HAS_PENDING_REVIEW",
              "NOT_HAS_PENDING_REVIEW",
            ].includes(value.operator)
          ) {
            assert(isNullish(value.value), `value not needed when ${value.operator}`);
          }
          if (["HAS_BG_CHECK_TOPICS", "NOT_HAS_BG_CHECK_TOPICS"].includes(value.operator)) {
            validateValue(value.value, "string", true);
          }
          break;
        case "ADVERSE_MEDIA_SEARCH":
          validateOperator(value.operator, ["HAS_PENDING_REVIEW", "NOT_HAS_PENDING_REVIEW"]);
          assert(isNullish(value.value), `value not needed when ${value.operator}`);
          break;
        case "USER_ASSIGNMENT":
          validateOperator(value.operator, ["EQUAL", "NOT_EQUAL"]);
          validateValue(value.value, "string");
          break;
        case "FILE":
          // any other operator besides HAS_VALUE and NOT_HAS_VALUE is not allowed on FILEs
          never();
      }
    }

    return {
      profileTypeFieldId: value.profileTypeFieldId,
      operator: value.operator,
      value: value.value,
    };
  } else if ("property" in value) {
    assert(isNonNullish(value.property), "property must be defined on property filter");
    assert(isNonNullish(value.operator), "operator must be defined on property filter");
    assert(isNullish(value.logicalOperator), "logicalOperator not allowed on property filter");
    assert(isNullish(value.conditions), "conditions not allowed on property filter");

    if (["HAS_VALUE", "NOT_HAS_VALUE"].includes(value.operator)) {
      assert(isNullish(value.value), `value not needed when ${value.operator}`);
    } else if (
      [
        "EQUAL",
        "NOT_EQUAL",
        "IS_ONE_OF",
        "NOT_IS_ONE_OF",
        "LESS_THAN",
        "LESS_THAN_OR_EQUAL",
        "GREATER_THAN",
        "GREATER_THAN_OR_EQUAL",
      ].includes(value.operator)
    ) {
      switch (value.property) {
        case "id":
          validateOperator(value.operator, ["EQUAL", "NOT_EQUAL", "IS_ONE_OF", "NOT_IS_ONE_OF"]);
          if (["EQUAL", "NOT_EQUAL"].includes(value.operator)) {
            validateValue(value.value, "string");
            assert(isGlobalId(value.value, "Profile"), "value must be a global ID of a Profile");
          } else if (["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(value.operator)) {
            validateValue(value.value, "string", true);
            assert(
              value.value.every((v: string) => isGlobalId(v, "Profile")),
              "value must be a global ID of a Profile",
            );
          }
          break;
        case "status":
          validateOperator(value.operator, ["EQUAL", "NOT_EQUAL", "IS_ONE_OF", "NOT_IS_ONE_OF"]);
          if (["EQUAL", "NOT_EQUAL"].includes(value.operator)) {
            validateValue(value.value, "string");
            assert(profileStatus.includes(value.value), "value is not a valid status");
          } else if (["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(value.operator)) {
            validateValue(value.value, "string", true);
            assert(
              value.value.every((v: string) => profileStatus.includes(v)),
              "value is not a valid status",
            );
          }
          break;
        case "createdAt":
        case "updatedAt":
        case "closedAt":
          validateOperator(value.operator, [
            "EQUAL",
            "NOT_EQUAL",
            "IS_ONE_OF",
            "NOT_IS_ONE_OF",
            "LESS_THAN",
            "LESS_THAN_OR_EQUAL",
            "GREATER_THAN",
            "GREATER_THAN_OR_EQUAL",
          ]);
          if (["IS_ONE_OF", "NOT_IS_ONE_OF"].includes(value.operator)) {
            validateValue(value.value, "string", true);
            assert(value.value.every(isValidDate), "value is not a valid date");
          } else if (
            [
              "EQUAL",
              "NOT_EQUAL",
              "LESS_THAN",
              "LESS_THAN_OR_EQUAL",
              "GREATER_THAN",
              "GREATER_THAN_OR_EQUAL",
            ].includes(value.operator)
          ) {
            validateValue(value.value, "string");
            assert(isValidDate(value.value), "value is not a valid date");
          }
          break;
        default:
          never(`property ${value.property} not allowed on property filter`);
      }
    } else {
      never(`operator ${value.operator} not allowed on property ${value.property}`);
    }

    return {
      property: value.property,
      operator: value.operator,
      value:
        value.property === "id"
          ? Array.isArray(value.value)
            ? value.value.map((v) => fromGlobalId(v, "Profile").id)
            : fromGlobalId(value.value, "Profile").id
          : value.value,
    };
  }
  never(`Unknown filter type: ${JSON.stringify(value)}`);
}

function validateOperator(
  operator: ProfileQueryFilterOperator,
  validOperators: ProfileQueryFilterOperator[],
) {
  assert(validOperators.includes(operator), `operator ${operator} not allowed`);
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
