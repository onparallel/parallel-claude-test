import { isNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import { ProfileTypeField } from "../../db/__types";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import {
  mapAndValidateProfileQueryFilter,
  ProfileQueryFilterOperatorValues,
} from "../../util/ProfileQueryFilter";
import { NexusGenInputs, NexusGenObjects } from "../__types";

function mapProfileListViewDataInputSortToDatabase(sort: {
  field: string;
  direction: "ASC" | "DESC";
}) {
  if (sort.field.startsWith("field_")) {
    const globalId = sort.field.replace("field_", "");
    const id = fromGlobalId(globalId, "ProfileTypeField").id;
    return { field: `field_${id}`, direction: sort.direction };
  }
  return { field: sort.field, direction: sort.direction };
}

export function mapAndValidateProfileListView(
  input: NexusGenInputs["ProfileListViewDataInput"],
  profileTypeFieldsById: Record<number, ProfileTypeField>,
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
    status: input.status ?? null,
    sort: input.sort ? mapProfileListViewDataInputSortToDatabase(input.sort) : null,
    values: input.values
      ? mapAndValidateProfileQueryFilter(input.values, profileTypeFieldsById)
      : null,
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
      ...pick(v, ["logicalOperator", "operator", "property"]),
      value:
        v.value !== null
          ? profileTypeField?.type === "USER_ASSIGNMENT"
            ? toGlobalId("User", v.value)
            : v.property === "id"
              ? toGlobalId("Profile", v.value)
              : v.value
          : null,
      profileTypeFieldId: v.profileTypeFieldId
        ? toGlobalId("ProfileTypeField", v.profileTypeFieldId)
        : v.profileTypeFieldId,
      conditions: v.conditions?.map(mapValuesFilterFromDatabase(profileTypeFieldsById)),
    };
  };
}
