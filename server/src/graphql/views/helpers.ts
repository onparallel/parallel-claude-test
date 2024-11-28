import { isNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { ProfileFieldValuesFilterOperatorValues } from "../../util/ProfileFieldValuesFilter";
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
    values: input.values ?? null,
  };
}

export function mapProfileListViewDataFromDatabase(data: NexusGenObjects["ProfileListViewData"]) {
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
    values: data.values ? mapValuesFilter(data.values) : null,
  };
}
function mapValuesFilter(v: any) {
  assert(
    isNullish(v.logicalOperator) || ["AND", "OR"].includes(v.logicalOperator),
    `Invalid logical operator: ${v.logicalOperator}`,
  );
  assert(
    isNullish(v.operator) || ProfileFieldValuesFilterOperatorValues.includes(v.operator),
    "Invalid operator",
  );
  assert(isNullish(v.conditions) || Array.isArray(v.conditions), "Invalid conditions");
  assert(
    isNullish(v.profileTypeFieldId) || typeof v.profileTypeFieldId === "number",
    "Invalid profileTypeFieldId",
  );

  return {
    ...pick(v, ["logicalOperator", "value", "operator"]),
    profileTypeFieldId: v.profileTypeFieldId
      ? toGlobalId("ProfileTypeField", v.profileTypeFieldId)
      : v.profileTypeFieldId,
    conditions: v.conditions?.map(mapValuesFilter),
  };
}
