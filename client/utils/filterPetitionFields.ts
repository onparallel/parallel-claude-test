import { gql } from "@apollo/client";
import { filterPetitionFields_PetitionFieldFragment } from "@parallel/graphql/__types";
import { zip } from "remeda";
import { PetitionFieldIndex } from "./fieldIndices";
import { FieldLogic } from "./fieldLogic/useFieldLogic";
import { isFileTypeField } from "./isFileTypeField";

export type PetitionFieldFilterType =
  | "SHOW_NOT_REPLIED"
  | "SHOW_REPLIED"
  | "SHOW_ONLY_FILE_UPLOAD"
  | "SHOW_REVIEWED"
  | "SHOW_NOT_REVIEWED"
  | "SHOW_WITH_COMMENTS";

export type PetitionFieldFilter = Record<PetitionFieldFilterType, boolean>;

type FilterPetitionFieldResult<T extends filterPetitionFields_PetitionFieldFragment> =
  | {
      type: "FIELD";
      field: T;
      fieldIndex: PetitionFieldIndex;
      fieldLogic: FieldLogic;
      childrenFieldIndices?: string[];
    }
  | { type: "HIDDEN"; count: number };

export const defaultFieldsFilter = {
  SHOW_NOT_REPLIED: false,
  SHOW_REPLIED: false,
  SHOW_ONLY_FILE_UPLOAD: false,
  SHOW_REVIEWED: false,
  SHOW_NOT_REVIEWED: false,
  SHOW_WITH_COMMENTS: false,
};

export function filterPetitionFields<T extends filterPetitionFields_PetitionFieldFragment>(
  fieldsWithIndices: [field: T, fieldIndex: PetitionFieldIndex, childrenFieldIndices?: string[]][],
  fieldLogic: FieldLogic[],
  filter: PetitionFieldFilter = defaultFieldsFilter,
): FilterPetitionFieldResult<T>[] {
  const filtered = [] as FilterPetitionFieldResult<T>[];
  for (const [[field, fieldIndex, childrenFieldIndices], _fieldLogic] of zip(
    fieldsWithIndices,
    fieldLogic ?? fieldsWithIndices.map(() => undefined),
  )) {
    const last = filtered[filtered.length - 1];
    if (!(_fieldLogic?.isVisible ?? true)) {
      if (last?.type === "HIDDEN") {
        last.count += 1;
      } else {
        filtered.push({ type: "HIDDEN", count: 1 });
      }
    } else {
      const conditions: boolean[] = [];
      if (filter.SHOW_REPLIED && !filter.SHOW_NOT_REPLIED) {
        conditions.push(field.replies.length > 0);
      }

      if (!filter.SHOW_REPLIED && filter.SHOW_NOT_REPLIED) {
        conditions.push(field.replies.length === 0);
      }

      if (filter.SHOW_ONLY_FILE_UPLOAD) {
        conditions.push(isFileTypeField(field.type));
      }

      if (filter.SHOW_REVIEWED && !filter.SHOW_NOT_REVIEWED) {
        conditions.push(
          field.replies.length > 0 && field.replies.every((r) => r.status === "APPROVED"),
        );
      }
      if (!filter.SHOW_REVIEWED && filter.SHOW_NOT_REVIEWED) {
        conditions.push(
          field.replies.length === 0 ||
            field.replies.some((r) => r.status === "REJECTED" || r.status === "PENDING"),
        );
      }
      if (filter.SHOW_WITH_COMMENTS) {
        conditions.push(field.comments.length > 0);
      }
      if (conditions.every((x) => x)) {
        filtered.push({
          type: "FIELD",
          field,
          fieldIndex,
          childrenFieldIndices,
          fieldLogic: _fieldLogic,
        });
      }
    }
  }
  return filtered;
}

filterPetitionFields.fragments = {
  PetitionField: gql`
    fragment filterPetitionFields_PetitionField on PetitionField {
      id
      type
      isReadOnly
      comments {
        id
      }
      replies {
        id
        status
      }
    }
  `,
};
