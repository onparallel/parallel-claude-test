import { PetitionField, PetitionFieldReply } from "../db/__types";
import { PetitionVariable } from "../db/repositories/PetitionRepository";
import { completedFieldReplies } from "./completedFieldReplies";
import { applyFieldVisibility } from "./fieldLogic";
import { Maybe } from "./types";

interface InnerPartialField
  extends Pick<
    PetitionField,
    "id" | "type" | "options" | "optional" | "is_internal" | "visibility" | "math"
  > {}
interface PartialField extends InnerPartialField {
  children: Maybe<
    (InnerPartialField & {
      parent: Maybe<Pick<PetitionField, "id">>;
      replies: Pick<PetitionFieldReply, "content" | "anonymized_at">[];
    })[]
  >;
  replies: (Pick<PetitionFieldReply, "content" | "anonymized_at"> & {
    children: Maybe<
      {
        field: Omit<InnerPartialField, "visibility" | "math">;
        replies: Pick<PetitionFieldReply, "content" | "anonymized_at">[];
      }[]
    >;
  })[];
}

interface PartialPetition {
  fields: PartialField[];
  variables: PetitionVariable[];
}

export function petitionIsCompleted(petition: PartialPetition, publicContext?: boolean) {
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
