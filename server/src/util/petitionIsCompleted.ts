import { PetitionFieldType } from "../db/__types";
import { completedFieldReplies } from "./completedFieldReplies";
import { applyFieldVisibility, PetitionFieldMath, PetitionFieldVisibility } from "./fieldLogic";

interface FieldLogicPetitionFieldReplyInner {
  content: any;
  anonymized_at: Date | null;
}

interface FieldLogicPetitionFieldInner {
  id: number;
  type: PetitionFieldType;
  options: any;
  visibility: PetitionFieldVisibility | null;
  math: PetitionFieldMath[] | null;
  is_internal: boolean;
  optional: boolean;
}
interface FieldLogicPetitionFieldInput extends FieldLogicPetitionFieldInner {
  children?:
    | (FieldLogicPetitionFieldInner & { replies: FieldLogicPetitionFieldReplyInner[] })[]
    | null;
  replies: (FieldLogicPetitionFieldReplyInner & {
    children?:
      | {
          field: Pick<
            FieldLogicPetitionFieldInner,
            "id" | "type" | "is_internal" | "optional" | "options"
          >;
          replies: FieldLogicPetitionFieldReplyInner[];
        }[]
      | null;
  })[];
}

interface FieldLogicPetitionInput {
  variables: { name: string; defaultValue: number }[];
  customLists: { name: string; values: string[] }[];
  automaticNumberingConfig: { numberingType: "NUMBERS" | "LETTERS" | "ROMAN_NUMERALS" } | null;
  standardListDefinitions: { listName: string; values: { key: string }[] }[];
  fields: FieldLogicPetitionFieldInput[];
}

export function petitionIsCompleted(petition: FieldLogicPetitionInput, publicContext?: boolean) {
  return applyFieldVisibility(petition).every(
    (field) =>
      (publicContext ? field.is_internal : false) ||
      field.type === "HEADING" ||
      (field.type !== "FIELD_GROUP" && field.optional) || // FIELD_GROUP will always have at least 1 visible required child
      (field.type !== "FIELD_GROUP" && completedFieldReplies(field).length > 0) ||
      (field.type === "FIELD_GROUP" &&
        field.replies.every((gr) =>
          (gr.children ?? []).every(
            (child) =>
              (publicContext ? child.field.is_internal : false) ||
              child.field.type === "HEADING" ||
              child.field.optional ||
              completedFieldReplies({ ...child.field, replies: child.replies }).length > 0,
          ),
        )),
  );
}
