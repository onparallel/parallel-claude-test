import { PetitionFieldType } from "../db/__types";
import { completedFieldReplies } from "./completedFieldReplies";
import {
  applyFieldVisibility,
  FieldLogicPetitionInput,
  PetitionFieldMath,
  PetitionFieldVisibility,
} from "./fieldLogic";

interface PetitionIsCompletedFieldReplyInner {
  content: any;
  anonymized_at: Date | null;
}

interface PetitionIsCompletedFieldInner {
  id: number;
  type: PetitionFieldType;
  options: any;
  visibility: PetitionFieldVisibility | null;
  math: PetitionFieldMath | null;
  is_internal: boolean;
  optional: boolean;
}
interface PetitionIsCompletedField extends PetitionIsCompletedFieldInner {
  children?:
    | (PetitionIsCompletedFieldInner & { replies: PetitionIsCompletedFieldReplyInner[] })[]
    | null;
  replies: (PetitionIsCompletedFieldReplyInner & {
    children?:
      | {
          field: Pick<
            PetitionIsCompletedFieldInner,
            "id" | "type" | "is_internal" | "optional" | "options"
          >;
          replies: PetitionIsCompletedFieldReplyInner[];
        }[]
      | null;
  })[];
}

export function petitionIsCompleted(
  petition: FieldLogicPetitionInput<PetitionIsCompletedField>,
  publicContext?: boolean,
) {
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
