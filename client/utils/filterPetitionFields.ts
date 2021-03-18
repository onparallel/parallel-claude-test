import { gql } from "@apollo/client";
import { filterPetitionFields_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "./fieldIndices";
import { zipX } from "./zipX";

export type PetitionFieldFilterType = "SHOW_NOT_REPLIED" | "SHOW_NOT_VISIBLE";

export type PetitionFieldFilter = Record<PetitionFieldFilterType, boolean>;

type FilterPetitionFieldResult<
  T extends filterPetitionFields_PetitionFieldFragment
> =
  | {
      type: "FIELD";
      field: T;
      fieldIndex: PetitionFieldIndex;
      isVisible: boolean;
    }
  | ({ type: "HIDDEN" } & Partial<Record<PetitionFieldFilterType, number>>);

export const defaultFieldsFilter = {
  SHOW_NOT_REPLIED: true,
  SHOW_NOT_VISIBLE: false,
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
    const reason = ([
      [!isVisible, "SHOW_NOT_VISIBLE"],
      [!field.isReadOnly && field.replies.length === 0, "SHOW_NOT_REPLIED"],
    ] as [boolean, PetitionFieldFilterType][]).find(
      ([check, type]) => check && !filter[type]
    );
    if (reason) {
      const [, type] = reason;
      const last = filtered[filtered.length - 1];
      if (last?.type === "HIDDEN") {
        last[type] = (last[type] ?? 0) + 1;
      } else {
        filtered.push({ type: "HIDDEN", [type]: 1 });
      }
    } else {
      filtered.push({ type: "FIELD", field, fieldIndex, isVisible });
    }
  }
  return filtered;
}

filterPetitionFields.fragments = {
  PetitionField: gql`
    fragment filterPetitionFields_PetitionField on PetitionField {
      id
      isReadOnly
      replies {
        id
      }
    }
  `,
};
