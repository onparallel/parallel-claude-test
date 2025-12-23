import { isNullish, pick, pickBy } from "remeda";
import { assert } from "ts-essentials";
import { ProfileTypeField } from "../../db/__types";
import { fromGlobalId, isGlobalId, toGlobalId } from "../../util/globalId";
import { ProfileQueryFilterOperatorValues } from "../../util/ProfileQueryFilter";
import { NexusGenInputs, NexusGenObjects } from "../__types";

export function mapProfileListViewDataToDatabase(
  input: NexusGenInputs["ProfileListViewDataInput"],
) {
  return {
    columns:
      input.columns?.map((col) => {
        if (col.startsWith("field_")) {
          const globalId = col.replace("field_", "");
          const { id } = fromGlobalId(globalId, "ProfileTypeField");
          return `field_${id}`;
        }

        return col;
      }) ?? null,
    search: input.search ?? null,
    sort: input.sort ?? null,
    status: input.status ?? null,
    values: input.values ? mapProfileFieldValuesFilterToDatabase(input.values) : null,
  };
}

export function mapProfileListViewDataFromDatabase(
  data: NexusGenObjects["ProfileListViewData"],
  profileTypeFieldsById: Record<number, ProfileTypeField>,
) {
  return {
    columns:
      data.columns?.map((col) => {
        if (col.startsWith("field_")) {
          const id = col.replace("field_", "");
          return `field_${toGlobalId("ProfileTypeField", id)}`;
        }

        return col;
      }) ?? null,
    search: data.search ?? null,
    sort: data.sort ?? null,
    status: data.status ?? null,
    values: data.values ? mapValuesFilterFromDatabase(profileTypeFieldsById)(data.values) : null,
  };
}

function mapValuesFilterFromDatabase(profileTypeFieldsById: Record<number, ProfileTypeField>) {
  return (v: any) => {
    assert(
      isNullish(v.logicalOperator) || ["AND", "OR"].includes(v.logicalOperator),
      `Invalid logical operator: ${v.logicalOperator}`,
    );
    assert(
      isNullish(v.operator) || ProfileQueryFilterOperatorValues.includes(v.operator),
      "Invalid operator",
    );
    assert(isNullish(v.conditions) || Array.isArray(v.conditions), "Invalid conditions");
    assert(
      isNullish(v.profileTypeFieldId) || typeof v.profileTypeFieldId === "number",
      "Invalid profileTypeFieldId",
    );

    const profileTypeField = v.profileTypeFieldId
      ? profileTypeFieldsById[v.profileTypeFieldId]
      : null;

    return {
      ...pick(v, ["logicalOperator", "operator"]),
      value: v.value
        ? profileTypeField?.type === "USER_ASSIGNMENT"
          ? toGlobalId("User", v.value)
          : v.value
        : null,
      profileTypeFieldId: v.profileTypeFieldId
        ? toGlobalId("ProfileTypeField", v.profileTypeFieldId)
        : v.profileTypeFieldId,
      conditions: v.conditions?.map(mapValuesFilterFromDatabase(profileTypeFieldsById)),
    };
  };
}

export function mapProfileFieldValuesFilterToDatabase(
  v: NexusGenInputs["ProfileFieldValuesFilter"] | null | undefined,
): any {
  if (isNullish(v)) {
    return v;
  }

  return pickBy(
    {
      ...pick(v, ["logicalOperator", "operator", "profileTypeFieldId"]),
      conditions: v.conditions?.map(mapProfileFieldValuesFilterToDatabase),
      value: v.value
        ? isGlobalId(v.value, "User")
          ? fromGlobalId(v.value, "User").id
          : v.value
        : v.value,
    },
    (value) => value !== undefined,
  );
}
