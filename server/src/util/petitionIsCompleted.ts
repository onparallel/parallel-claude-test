import { PetitionField, PetitionFieldReply } from "../db/__types";
import { completedFieldReplies } from "./completedFieldReplies";
import { applyFieldLogic } from "./fieldLogic";
import { Maybe } from "./types";

interface PartialField
  extends Pick<
    PetitionField,
    "id" | "type" | "options" | "optional" | "is_internal" | "visibility"
  > {
  children: Maybe<
    (Pick<PetitionField, "id" | "type" | "options" | "optional" | "is_internal" | "visibility"> & {
      parent: Maybe<Pick<PetitionField, "id">>;
      replies: Pick<PetitionFieldReply, "content" | "anonymized_at">[];
    })[]
  >;
  replies: (Pick<PetitionFieldReply, "content" | "anonymized_at"> & {
    children: Maybe<
      {
        field: Pick<PetitionField, "id" | "type" | "options" | "optional" | "is_internal">;
        replies: Pick<PetitionFieldReply, "content" | "anonymized_at">[];
      }[]
    >;
  })[];
}

export function petitionIsCompleted(fields: PartialField[], publicContext?: boolean) {
  return applyFieldLogic(fields).every(
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
