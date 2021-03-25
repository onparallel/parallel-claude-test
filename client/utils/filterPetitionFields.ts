import { gql } from "@apollo/client";
import { filterPetitionFields_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "./fieldIndices";
import { zipX } from "./zipX";

export type PetitionFieldFilterType =
  | "SHOW_REPLIED"
  | "SHOW_REVIEWED"
  | "SHOW_NOT_REVIEWED"
  | "SHOW_WITH_COMMENTS";

export type PetitionFieldFilter = Record<PetitionFieldFilterType, boolean>;

type FilterPetitionFieldResult<
  T extends filterPetitionFields_PetitionFieldFragment
> =
  | {
      type: "FIELD";
      field: T;
      fieldIndex: PetitionFieldIndex;
    }
  | { type: "HIDDEN"; count: number };

export const defaultFieldsFilter = {
  SHOW_REPLIED: false,
  SHOW_REVIEWED: false,
  SHOW_NOT_REVIEWED: false,
  SHOW_WITH_COMMENTS: false,
};

export function filterPetitionFields<
  T extends filterPetitionFields_PetitionFieldFragment
>(
  fields: T[],
  fieldIndices: PetitionFieldIndex[],
  fieldVisibility: boolean[],
  filter: PetitionFieldFilter = defaultFieldsFilter
): FilterPetitionFieldResult<T>[] {
  const filtered = [] as FilterPetitionFieldResult<T>[];
  for (const [field, fieldIndex, isVisible = true] of zipX(
    fields,
    fieldIndices,
    fieldVisibility ?? []
  )) {
    const last = filtered[filtered.length - 1];
    if (!isVisible) {
      if (last?.type === "HIDDEN") {
        last.count += 1;
      } else {
        filtered.push({ type: "HIDDEN", count: 1 });
      }
    } else {
      const conditions: boolean[] = [];
      if (filter.SHOW_REPLIED) {
        conditions.push(field.replies.length > 0);
      }
      if (filter.SHOW_REVIEWED && !filter.SHOW_NOT_REVIEWED) {
        conditions.push(field.validated);
      }
      if (!filter.SHOW_REVIEWED && filter.SHOW_NOT_REVIEWED) {
        conditions.push(!field.validated);
      }
      if (filter.SHOW_WITH_COMMENTS) {
        conditions.push(field.comments.length > 0);
      }
      if (field.isReadOnly || conditions.every((x) => x)) {
        filtered.push({ type: "FIELD", field, fieldIndex });
      }
    }
  }
  return filtered;
}

filterPetitionFields.fragments = {
  PetitionField: gql`
    fragment filterPetitionFields_PetitionField on PetitionField {
      id
      isReadOnly
      validated
      comments {
        id
      }
      replies {
        id
      }
    }
  `,
};
